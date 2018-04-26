#/bin/bash
#cd "$( dirname "${BASH_SOURCE[0]}" )"
#DIR="$(cd -P "$(dirname "$0")" && pwd)"
cd -P "$(dirname "$0")"
backup_dir=../backup
DATE=`date +%Y%m%d-%H%M%S`
root_dir=$backup_dir/$DATE
submissions_dir=./submissions
homeworks_dir=./homeworks
problems_dir=./problems
git_dir=/home/git/repositories
gitosis_admin=./gitosis-admin
dist_static_dir=./dist/static
config_file=./dist/config.js
semantic_src_dir=./semantic/src
apache2_config_dir=/etc/apache2/sites-available/
mkdir -p $root_dir
mongodump --archive=$root_dir/dsajudge.${DATE}.gz --gzip --db dsajudge
tar -zcf $root_dir/submissions.tar.gz $submissions_dir
tar -zcf $root_dir/homeworks.tar.gz $homeworks_dir
tar -zcf $root_dir/git.tar.gz $git_dir
tar -zcf $root_dir/problems.tar.gz $problems_dir
tar -zcf $root_dir/gitosis_admin.tar.gz $gitosis_admin
tar -zcf $root_dir/dist.static.tar.gz $dist_static_dir
tar -zcf $root_dir/semantic.src.tar.gz $semantic_src_dir
tar -zcf $root_dir/apache2.config.tar.gz $apache2_config_dir
cp $config_file $root_dir/
#gdrive upload -r $root_dir
gdrive sync upload $backup_dir 175ohpqrGDKRqNQc2GNVNu6m06iMSeOlj
