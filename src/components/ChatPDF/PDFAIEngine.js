// Professional Client-Side AI Engine for PDF Q&A
export class PDFAIEngine {
  constructor(pages) {
    this.pages = pages; // [{pageNum, text}]
    this.fullText = pages.map(p => p.text).join(' ');
    this.stopWords = new Set(['the','and','for','are','but','not','you','all','can','was','one','our','out','get','has','him','his','its','let','man','new','now','see','two','way','who','did','say','she','too','use','with','that','this','from','they','been','have','will','what','when','some','then','than','into','your','said','each','more','most','also','which','there','their','would','could','should','about','after','these','those','where','other','very','just','only','even','over','such','here','than','were','also','been','both','each','make','many','much','must','once','seem','take','tell','them','well','will','work','year']);
    this.wordFreq = this._buildFreq(this.fullText);
  }

  _buildFreq(text) {
    const freq = {};
    text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !this.stopWords.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    return freq;
  }

  _scoreS(sentence) {
    const words = sentence.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !this.stopWords.has(w));
    if (!words.length) return 0;
    return words.reduce((s, w) => s + (this.wordFreq[w] || 0), 0) / words.length;
  }

  _getSentences(text) {
    return (text.match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).filter(s => s.length > 25);
  }

  _topSentences(text, n = 5, pageNum = null) {
    const sents = this._getSentences(text);
    return sents.map(s => ({ text: s, score: this._scoreS(s), page: pageNum }))
      .sort((a, b) => b.score - a.score).slice(0, n);
  }

  summarize() {
    const parts = ['## 📋 Document Summary\n'];
    const n = this.pages.length;

    // Top sentences from beginning, middle, end
    const zones = [
      { label: '**Introduction**', pages: this.pages.slice(0, Math.max(1, Math.floor(n * 0.2))) },
      { label: '**Main Content**', pages: this.pages.slice(Math.floor(n * 0.2), Math.floor(n * 0.8)) },
      { label: '**Conclusions**', pages: this.pages.slice(Math.floor(n * 0.8)) },
    ];

    for (const zone of zones) {
      const zoneText = zone.pages.map(p => p.text).join(' ');
      const sents = this._topSentences(zoneText, 3, zone.pages[0]?.pageNum);
      if (sents.length) {
        parts.push(`\n${zone.label} [📄 Pg ${zone.pages[0]?.pageNum || 1}–${zone.pages[zone.pages.length-1]?.pageNum || 1}]:`);
        sents.forEach(s => parts.push(`> ${s.text}`));
      }
    }

    // Top keywords
    const topKw = Object.entries(this.wordFreq).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([w]) => `\`${w}\``);
    if (topKw.length) parts.push(`\n**Key Themes:** ${topKw.join(', ')}`);
    parts.push(`\n*This is a ${n}-page document. Ask me about any specific section, clause, or topic.*`);

    return parts.join('\n');
  }

  keyPoints() {
    const all = this.pages.flatMap(p =>
      this._getSentences(p.text).map(s => ({ text: s, score: this._scoreS(s), page: p.pageNum }))
    ).filter(s => s.text.length > 40).sort((a, b) => b.score - a.score).slice(0, 10);

    const lines = ['## 🔑 Key Points\n'];
    all.forEach((s, i) => lines.push(`${i+1}. ${s.text} [📄 Pg ${s.page}]`));
    lines.push('\n*Would you like me to elaborate on any of these points?*');
    return lines.join('\n');
  }

  faq() {
    const topSents = this.pages.flatMap(p =>
      this._getSentences(p.text).map(s => ({ text: s, score: this._scoreS(s), page: p.pageNum }))
    ).sort((a, b) => b.score - a.score).slice(0, 6);

    const lines = ['## ❓ Frequently Asked Questions\n'];
    topSents.forEach((s, i) => {
      const q = `What does the document say about "${s.text.split(' ').slice(0, 5).join(' ')}..."?`;
      lines.push(`**Q${i+1}: ${q}**`);
      lines.push(`> ${s.text} [📄 Pg ${s.page}]\n`);
    });
    return lines.join('\n');
  }

  risks() {
    const riskKw = ['penalty','liable','liability','terminate','breach','default','fine','prohibited','shall not','must not','void','null','forfeit','damage','indemnif','obligation','restrict','deadline','expire','unauthor','confidential','warrant','misuse','violation'];
    const hits = [];
    for (const page of this.pages) {
      const sents = this._getSentences(page.text);
      for (const sent of sents) {
        const lower = sent.toLowerCase();
        const matched = riskKw.find(k => lower.includes(k));
        if (matched) hits.push({ text: sent, keyword: matched, page: page.pageNum });
      }
    }
    if (!hits.length) return '## ⚠️ Risk Analysis\n\nNo obvious risk indicators (penalties, liability, termination clauses) were found in this document. This appears to be a low-risk document based on keyword analysis.\n\n*Always consult a qualified professional for legal or financial decisions.*';

    const lines = ['## ⚠️ Risk Analysis\n', `Found **${hits.length} risk-related items**:\n`];
    hits.slice(0, 8).forEach((h, i) => {
      lines.push(`**${i+1}. Risk: \`${h.keyword}\`** [📄 Pg ${h.page}]`);
      lines.push(`> ${h.text}\n`);
    });
    lines.push('*Consult a qualified professional before making decisions based on this analysis.*');
    return lines.join('\n');
  }

  explainTerms() {
    const termPatterns = [/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, /"\w[\w\s]+"/g, /\b\w+tion\b/gi, /\b\w+ment\b/gi];
    const termSet = new Set();
    for (const page of this.pages) {
      termPatterns.forEach(pat => {
        const matches = page.text.match(pat) || [];
        matches.filter(m => m.length > 5 && m.length < 40).forEach(m => termSet.add(m.trim()));
      });
    }
    const terms = [...termSet].slice(0, 10);
    if (!terms.length) return '## 📖 Technical Terms\n\nNo specialized terms were detected. The document appears to use common language.\n';
    const lines = ['## 📖 Key Terms & Concepts\n'];
    terms.forEach((t, i) => lines.push(`**${i+1}. ${t}** — This term appears in the document. Ask me specifically about it for more context.\n`));
    return lines.join('\n');
  }

  answerQuestion(query) {
    const qWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !this.stopWords.has(w));
    if (!qWords.length) return 'Please ask a more specific question about the document.';

    const matches = [];
    for (const page of this.pages) {
      const sents = this._getSentences(page.text);
      for (const sent of sents) {
        const lower = sent.toLowerCase();
        const hits = qWords.filter(w => lower.includes(w)).length;
        const rel = hits / qWords.length;
        if (rel > 0) matches.push({ text: sent, relevance: rel, hits, page: page.pageNum });
      }
    }

    matches.sort((a, b) => b.relevance - a.relevance || b.hits - a.hits);
    const top = matches.slice(0, 5);

    if (!top.length) return `I searched the document thoroughly but could not find information directly related to your question.\n\n**Possible reasons:**\n• The topic may not be covered in this document\n• Try different keywords\n• Ask me for a general summary instead`;

    const lines = [`Based on the document, here is what I found:\n`];
    top.forEach((m, i) => {
      lines.push(`**Finding ${i+1}** [📄 Pg ${m.page}]:`);
      lines.push(`> "${m.text}"\n`);
    });
    lines.push('*Would you like me to elaborate further on any of these findings?*');
    return lines.join('\n');
  }
}
