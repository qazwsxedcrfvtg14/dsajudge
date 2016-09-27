#!/usr/bin/env ruby

Dir.chdir(File.dirname(__FILE__))
load '../loaddb.rb'

require 'logger'
require_relative 'pool'
require_relative 'c_judger'

$keep_going = true
Signal.trap(:INT){$keep_going = false}
Signal.trap(:TERM){$keep_going = false}

num_workers = (ARGV.shift || 8).to_i
$stderr.puts "started with #{num_workers} workers"
pool = Pool.new(num_workers)

while $keep_going
  sub = Submission.order_by(:id).first(status: 'Waiting')
  unless sub
    sleep(0.1)
    next
  end
  sub.update(status: 'Queueing', judge_log: sub.judge_log + "Queueing - #{Time.now}\n")
  pool.schedule(sub.id){|id| CJudger.new(9000 + Thread.current[:id]).judge(id)}
end
