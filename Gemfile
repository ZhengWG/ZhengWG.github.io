# frozen_string_literal: true

source "https://rubygems.org"

gemspec

# webrick 不再是 Ruby 3.0+ 的标准库，`jekyll serve` 需要它
gem "webrick", "~> 1.8"

group :test do
  gem "html-proofer", "~> 3.18"
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
install_if -> { RUBY_PLATFORM =~ %r!mingw|mswin|java! } do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :install_if => Gem.win_platform?
