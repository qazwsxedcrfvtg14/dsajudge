#/bin/sh
mkdir /dev/shm/isolate
mkdir /dev/shm/isolate/META
mkdir /tmp/judge-comp
mkdir /tmp/judge_git
sudo bash ./start_root.sh
(cd dist; NODE_ENV=production forever start server.js)
forever start -c python update_git.py
