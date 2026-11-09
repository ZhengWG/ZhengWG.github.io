require 'digest'
require 'json'

module Jekyll
  class LabIndex < Generator
    safe true
    priority :low

    def generate(site)
      posts = site.posts.docs.select { |post| post.data['published'] != false && post.date <= site.time }
      by_basename = {}
      posts.each { |post| by_basename[File.basename(post.path, '.*')] = post }
      converter = site.find_converter_instance(Jekyll::Converters::Markdown)
      index = posts.sort_by(&:date).reverse.map do |post|
        entry = {
          'slug' => post.data['slug'], 'url' => post.url,
          'title' => post.data['title'], 'date' => post.date.strftime('%Y-%m-%d'),
          'description' => post.data['description'] || '',
          'tags' => post.data['tags'] || [], 'categories' => post.data['categories'] || [],
          'math' => !!post.data['mathjax'], 'mermaid' => !!post.data['mermaid'],
          'image' => post.data['image'],
          'language' => post.content.match?(/[\u4e00-\u9fff]/) ? 'zh-Hans' : 'en'
        }
        translation = translation_for(site, post)
        if translation && !translation['title'].empty?
          entry['title_en'] = translation['title']
          entry['description_en'] = translation['description']
          entry['card_title'] = translation['card_title'] unless translation['card_title'].empty?
          file_id = Digest::SHA1.hexdigest(File.basename(post.path))[0, 12]
          html = converter.convert(expand_post_urls(translation['body'], by_basename))
          html = html.gsub(/\{([\{%])/, '&#123;\1')
          page = PageWithoutAFile.new(site, site.source, 'assets/i18n/en', "#{file_id}.html")
          page.content = html
          page.data = { 'layout' => nil, 'sitemap' => false }
          site.pages << page
          entry['en'] = "#{site.baseurl}/assets/i18n/en/#{file_id}.html"
        end
        entry
      end
      page = PageWithoutAFile.new(site, site.source, 'assets/data', 'posts.json')
      page.content = JSON.generate(index)
      page.data = { 'layout' => nil, 'sitemap' => false }
      site.pages << page
    end

    def translation_for(site, post)
      path = File.join(site.source, '_i18n', 'en', File.basename(post.path))
      return nil unless File.file?(path)

      raw = File.read(path, encoding: 'UTF-8').sub(/\A\uFEFF/, '')
      return { 'title' => '', 'description' => '', 'card_title' => '', 'body' => raw } unless raw.start_with?('---')

      match = raw.match(/\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*\r?\n(.*)\z/m)
      return { 'title' => '', 'description' => '', 'card_title' => '', 'body' => raw } unless match

      front_matter = match[1]
      body = match[2]
      meta = {}
      front_matter.to_s.each_line do |line|
        next unless line =~ /\A([A-Za-z0-9_]+):[ \t]*(.*)\r?\n?\z/

        key = Regexp.last_match(1)
        value = Regexp.last_match(2).strip
        value = value[1..-2] if value.length >= 2 && value.start_with?('"', "'") && value.end_with?(value[0])
        meta[key] = value
      end
      {
        'title' => meta['title'].to_s,
        'description' => meta['description'].to_s,
        'card_title' => meta['card_title'].to_s,
        'body' => body.to_s.sub(/\A\n/, '')
      }
    end

    def expand_post_urls(body, posts_by_basename)
      body.gsub(/\{%[ \t]*post_url[ \t]+([^\s%]+)[ \t]*%\}/) do
        name = Regexp.last_match(1)
        post = posts_by_basename[name]
        slug = name.sub(/^\d{2,4}-\d{1,2}-\d{1,2}-/, '')
        post ? post.url : "/posts/#{slug}/"
      end
    end
  end
end
