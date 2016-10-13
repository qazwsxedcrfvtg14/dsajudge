backup_dir=../backup
DATE=`date +%Y%m%d-%H%M%S`
root_dir=$backup_dir/$DATE
submissions_dir=./submissions
mkdir -p $root_dir
mongodump --archive=$root_dir/adajudge.${DATE}.gz --gzip --db adajudge
tar -zcf $root_dir/submissions.tar.gz $submissions_dir

