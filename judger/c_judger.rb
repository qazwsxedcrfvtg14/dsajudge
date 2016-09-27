#!/usr/bin/env ruby

require 'digest'
require 'fileutils'
require 'open3'
require 'tmpdir'
require 'yaml'
require_relative 'zbox'

class CJudger
  def initialize(uid, log = Logger.new($stderr))
    @uid = uid
    @log = log
  end

  def compile(sub, dir)
    sub.update(
      status: 'Compiling',
      judge_log: sub.judge_log + "Compiling - #{Time.now}\n"
    )
    IO.write(File.join(dir, 'a.cpp'), sub.source_code)
    stdout, stderr, status = ZBox.run(
      'g++ -std=c++11 -static -O2 a.cpp -o a.out',
      uid: @uid, cpu: 30, mem: 1 << 30, stdout: '/dev/null', stderr: 'compile.log', chdir: dir
    )
    sub.update(judge_log: sub.judge_log + stderr + stdout)
    if status == 0 && YAML.safe_load(stdout)['RE'] == false
      true
    else
      sub.update(
        status: 'Compile Error',
        score: 0,
        judge_message: IO.read(File.join(dir, 'compile.log'))
      )
      @log.info("Judged #{sub.id} (Compile Error)")
      false
    end
  end

  def judge(sub_id)
    @log.info("Judge ##{sub_id}")
    sub = Submission[sub_id]
    Dir.mktmpdir do |dir|
      FileUtils.chmod(0777, dir)
      break if !compile(sub, dir)
      prob = sub.problem
      score = 0
      prob.get_testdata.each do |i, i_path, o_path|
        sub.update(status: "Judging on test #{i}")
        ith_dir = File.join(dir, i.to_s)
        FileUtils.mkdir(ith_dir)
        FileUtils.cp(i_path, File.join(ith_dir, "#{i}.in"))
        FileUtils.cp(File.join(dir, 'a.out'), File.join(ith_dir, 'a.out'))
        FileUtils.cp(File.join(dir, 'a.cpp'), File.join(ith_dir, 'a.cpp'))
        stdout, stderr, status = ZBox.run(
          '/a.out', uid: @uid, cpu: prob.time_limit, mem: 1 << 30,
          stdin: "#{i}.in", stdout: "#{i}.user", stderr: 'stderr.log', chroot: ith_dir
        )
        sub.update(judge_log: sub.judge_log + stderr + stdout)
        judge_status = nil
        time_usage_ms = nil
        if status == 0
          info = YAML.safe_load(stdout)
          time_usage_ms = (info['cpu_time_usage'] * 1000).to_i
          if info['RE']
            judge_status = 'Runtime Error'
          elsif info['TLE']
            judge_status = 'Time Limit Exceeded'
          elsif prob.checker?
            sub.update(judge_log: sub.judge_log + "Checking - #{Time.now}\n")
            FileUtils.cp(o_path, ith_dir)
            FileUtils.cp(prob.checker_path, ith_dir)
            stdout, stderr, status = ZBox.run(
              "/checker a.cpp #{i}.user #{i}.in #{i}.out", uid: @uid, cpu: 30, mem: 1 << 30,
              stdout: 'checker.out', stderr: 'checker.err',  chroot: ith_dir
            )
            sub.update(judge_log: sub.judge_log + stderr + stdout)
            fail 'zbox fail when running checker' if status != 0
            sub.update(judge_log: sub.judge_log + IO.read(File.join(ith_dir, 'checker.err')))
            checker_info = YAML.safe_load(stdout)
            fail 'checker fail' if checker_info['RE'] || checker_info['TLE']
            checker_out = IO.read(File.join(ith_dir, 'checker.out'))
            sub.update(judge_log: sub.judge_log + checker_out)
            judge_status = (checker_out.start_with?('AC') ? 'Accepted' : 'Wrong Answer')
          else
            h1 = Digest::SHA256.file(File.join(ith_dir, "#{i}.user")).hexdigest
            h2 = Digest::SHA256.file(o_path).hexdigest
            judge_status = (h1 == h2 ? 'Accepted' : 'Wrong Answer')
          end
        else
          judge_status = 'Other'
        end
        JudgeDetail.create(submission_id: sub.id, test_num: i, status: judge_status, time_usage_ms: time_usage_ms)
        score += 1 if judge_status == 'Accepted'
      end
      sub.update(status: 'Judged', score: score)
      @log.info("Judged ##{sub.id}, score = #{sub.score}")
    end
  rescue StandardError => e
    @log.error(e.message)
    sub.update(status: 'Other', judge_log: sub.judge_log + e.message)
  end
end
