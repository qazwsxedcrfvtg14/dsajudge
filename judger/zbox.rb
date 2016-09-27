require 'open3'
require 'shellwords'

class ZBox
  def self.run(cmd, opt)
    args = ['./zbox']
    opt[:wall] ||= 2 * opt[:cpu] if opt[:cpu]
    opt.each{|k, v| args << "--#{k}" << v}
    Open3.capture3(args.shelljoin + ' ' + cmd)
  end
end
