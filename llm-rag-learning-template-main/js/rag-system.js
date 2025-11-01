// js/rag-system.js
class RAGSystem {
    constructor() {
        this.searchEngine = new VectorSearchEngine();
        // 第1回で作成したクライアントを再利用
        this.llm = new EducationLLMClient(API_CONFIG.studentId);
    }
    
    async initialize(documents) {
        console.log('RAGシステム初期化中...');
        for (const doc of documents) {
            await this.searchEngine.addDocument(
                doc.content, 
                doc  // メタデータも保存
            );
        }
        console.log(`${documents.length}件の文書を登録完了！`);
    }
    // ... 続く

    async query(question, options = {}) {
    // 1. 関連文書の検索
    const relevantDocs = await this.searchEngine.search(
        question, 
        options.retrieveCount || 3
    );
    
    if (relevantDocs.length === 0) {
        // 関連文書がなければ通常のLLM
        return await this.llm.chat(question);
    }
    
    // 2. コンテキストの構築
    const context = this.buildContext(relevantDocs);
    
    // 3. プロンプトの生成
    const prompt = this.buildPrompt(question, context);
    
    // 4. LLMで回答生成
    const response = await this.llm.chat(prompt);
    
    return { ...response, sources: relevantDocs };
}

buildContext(relevantDocs) {
    return relevantDocs
        .map((doc, index) => 
            `[文書${index + 1}] ${doc.document.text}`
        )
        .join('\n\n');
}

buildPrompt(question, context) {
    return `以下の文書を参考にして、質問に答えてください。

参考文書:
${context}

質問: ${question}

回答:`;
}

displayRAGResult(result) {
    const container = document.getElementById("rag-result");
    container.innerHTML += `<h3>参照文献</h3><p>${result.sources.map((doc, idx) =>
                `<li>文書${idx+1}: ${doc.document.text}</li>`
            ).join("")}</p>`;
    // HTMLとして表示
    container.innerHTML += `<h3>💡 回答</h3><p>${result.response}</p>`;
}

}
