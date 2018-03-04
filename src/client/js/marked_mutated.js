import marked from 'marked';

// This suppresses the transformation from "_text_" to "<em>text</em>", which
// often incorrectly transforms mathjax content, such as $a_1, a_2$.

marked.prototype.constructor.Parser.prototype.parse = function (src) {
    this.inline = new marked.InlineLexer(src.links, this.options, this.renderer);
    this.inline.rules.em = { exec: $.noop };
    this.tokens = src.reverse();

    var out = '';
    while (this.next()) {
        out += this.tok();
    }

    return out;
};

export default marked;
