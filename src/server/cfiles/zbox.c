#define _GNU_SOURCE

#include <errno.h>
#include <getopt.h>
#include <sched.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/resource.h>
#include <sys/time.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#define ERROR(format, ...) do { \
    fprintf(stderr, "ERROR - %s:%s:%d - " format, __FILE__, __func__, __LINE__, ##__VA_ARGS__); \
    if (errno) fprintf(stderr, " - %s", strerror(errno)); \
    fprintf(stderr, "\n"); \
    exit(EXIT_FAILURE); \
} while (0)

#define ASSERT(cond) do { if (!(cond)) ERROR("Assertion failed (%s)", #cond); } while (0)

char* my_strdup(char *s) {
    char *p = strdup(s);
    if (p == NULL) ERROR("strdup");
    return p;
}

double get_wall_time() {
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

const char *optstring = "+u:c:w:m:p:i:o:e:d:r:";
struct option const long_opts[] = {
    {"uid",    required_argument, NULL, 'u'},
    {"cpu",    required_argument, NULL, 'c'},
    {"wall",   required_argument, NULL, 'w'},
    {"mem",    required_argument, NULL, 'm'},
    {"proc",   required_argument, NULL, 'p'},
    {"stdin",  required_argument, NULL, 'i'},
    {"stdout", required_argument, NULL, 'o'},
    {"stderr", required_argument, NULL, 'e'},
    {"chdir",  required_argument, NULL, 'd'},
    {"chroot", required_argument, NULL, 'r'},
    { NULL,    0,                 NULL,  0 }
};

int    arg_uid         = -1;
int    arg_cpu_limit   = -1;
int    arg_wall_limit  = -1;
int    arg_mem_limit   = -1;
int    arg_proc_limit  = -1;
char  *arg_stdin       = NULL;
char  *arg_stdout      = NULL;
char  *arg_stderr      = NULL;
char  *arg_chdir       = NULL;
char  *arg_chroot      = NULL;
char  *cmd_name;
char **cmd_args;

void parse_args(int argc, char **argv) {
    int opt;
    while ((opt = getopt_long(argc, argv, optstring, long_opts, NULL)) != -1) {
        switch (opt) {
            case 'u': arg_uid        = atoi(optarg); break;
            case 'c': arg_cpu_limit  = atoi(optarg); break;
            case 'w': arg_wall_limit = atoi(optarg); break;
            case 'm': arg_mem_limit  = atoi(optarg); break;
            case 'p': arg_proc_limit = atoi(optarg); break;
            case 'i': arg_stdin      = my_strdup(optarg); break;
            case 'o': arg_stdout     = my_strdup(optarg); break;
            case 'e': arg_stderr     = my_strdup(optarg); break;
            case 'd': arg_chdir      = my_strdup(optarg); break;
            case 'r': arg_chroot     = my_strdup(optarg); break;
            default: ERROR("getopt failed");
        }
    }
    ASSERT(arg_uid == -1 || (9000 <= arg_uid && arg_uid < 10000));
    ASSERT(optind < argc);
    cmd_name = argv[optind];
    cmd_args = argv + optind;
}

void do_child() {
    ASSERT(setsid() != -1);
    if (arg_chroot != NULL) {
        ASSERT(chdir(arg_chroot) == 0);
        ASSERT(chroot(".") == 0);
    }
    if (arg_chdir != NULL) ASSERT(chdir(arg_chdir) == 0);
    if (arg_uid != -1) ASSERT(setuid(arg_uid) == 0);
    if (arg_stdin != NULL) ASSERT(freopen(arg_stdin, "r", stdin) != NULL);
    if (arg_stdout != NULL) ASSERT(freopen(arg_stdout, "w", stdout) != NULL);
    if (arg_stderr != NULL) ASSERT(freopen(arg_stderr, "w", stderr) != NULL);

#define RLIM(res, val) do { \
    struct rlimit rl = {.rlim_cur = val, .rlim_max = val}; \
    ASSERT(setrlimit(RLIMIT_ ## res, &rl) == 0); \
} while (0)

    if (arg_mem_limit != -1) {
        RLIM(AS, arg_mem_limit);
        RLIM(STACK, arg_mem_limit);
    }
    if (arg_cpu_limit != -1) RLIM(CPU, arg_cpu_limit);
    if (arg_proc_limit != -1) RLIM(NPROC, arg_proc_limit);

#undef RLIM

    char *envp[] = {"PATH=/usr/local/bin:/usr/bin:/bin", NULL};
    execvpe(cmd_name, cmd_args, envp);
    ERROR("execvpe");
}

int main(int argc, char *argv[]) {
    ASSERT(unshare(CLONE_FILES | CLONE_FS | CLONE_NEWIPC | CLONE_NEWNET | CLONE_NEWNS | CLONE_NEWUTS) == 0);
    parse_args(argc, argv);
    pid_t child_pid = fork();
    ASSERT(child_pid != -1);
    if (child_pid == 0) do_child();
    int child_status;
    struct rusage ru;
    double start_time = get_wall_time();
    double wall_time_usage;
    while (1) {
        wall_time_usage = get_wall_time() - start_time;
        if (arg_wall_limit != -1 && wall_time_usage > arg_wall_limit) {
            kill(-child_pid, SIGKILL);
            ASSERT(wait4(child_pid, &child_status, 0, &ru) != -1);
            break;
        }
        int ret = wait4(child_pid, &child_status, WNOHANG, &ru);
        if (ret == -1) ERROR("wait4");
        if (ret > 0) break;
        usleep(10000);
    }
    int TLE = WIFSIGNALED(child_status) && WTERMSIG(child_status) == SIGKILL;
    int RE = !TLE && (!WIFEXITED(child_status) || WEXITSTATUS(child_status));
    double cpu_time_usage = ru.ru_utime.tv_sec + ru.ru_utime.tv_usec / 1e6 + \
                            ru.ru_stime.tv_sec + ru.ru_stime.tv_usec / 1e6;
    if (TLE) { // XXX
        if (wall_time_usage < 0.5) {
            TLE = 0;
            RE = 1;
        } else {
            if (cpu_time_usage < arg_cpu_limit + 1e-3) cpu_time_usage = arg_cpu_limit + 1e-3;
        }
    }
    printf("RE: %s\n", RE ? "true" : "false");
    printf("TLE: %s\n", TLE ? "true" : "false");
    printf("cpu_time_usage: %.3f\n", cpu_time_usage);
    printf("wall_time_usage: %.3f\n", wall_time_usage);
    return 0;
}
