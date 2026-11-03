require 'json'

module Jekyll
  class LabIndex < Generator
    safe true
    priority :low

    def generate(site)
      posts = site.posts.docs.select { |post| post.data['published'] != false && post.date <= site.time }
      index = posts.sort_by(&:date).reverse.map do |post|
        {
          'slug' => post.data['slug'], 'url' => post.url,
          'title' => post.data['title'], 'date' => post.date.strftime('%Y-%m-%d'),
          'description' => post.data['description'] || '',
          'tags' => post.data['tags'] || [], 'categories' => post.data['categories'] || [],
          'math' => !!post.data['mathjax'], 'mermaid' => !!post.data['mermaid'],
          'image' => post.data['image'],
          'language' => post.content.match?(/[\u4e00-\u9fff]/) ? 'zh-Hans' : 'en'
        }
      end
      page = PageWithoutAFile.new(site, site.source, 'assets/data', 'posts.json')
      page.content = JSON.generate(index)
      page.data = { 'layout' => nil, 'sitemap' => false }
      site.pages << page
    end
  end
end
