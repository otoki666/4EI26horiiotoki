class LearningOntology {
  constructor() {
    this.concepts = new Map();
    this.relations = new Map();
  }

  // オントロジーデータの読み込み
  async loadOntology(ontologyData) {
    console.log("📚 オントロジーを読み込み中...");

    // 概念の追加
    for (const [conceptId, conceptData] of Object.entries(
      ontologyData.concepts
    )) {
      this.addConcept(conceptId, conceptData);
    }

    // 関係の追加
    for (const relation of ontologyData.relations) {
      this.addRelation(
        relation.from,
        relation.to,
        relation.type,
        relation.strength || 1.0
      );
    }

    console.log(`✅ ${this.concepts.size}個の概念を読み込みました`);
    console.log(`✅ ${this.relations.size}個の関係を読み込みました`);
  }

  // 概念の追加
  addConcept(id, properties) {
    this.concepts.set(id, {
      id: id,
      ...properties,
      addedAt: new Date(),
    });
  }

  // 関係の追加
  addRelation(fromConcept, toConcept, relationType, strength = 1.0) {
    const relationKey = `${fromConcept}-${relationType}-${toConcept}`;
    this.relations.set(relationKey, {
      from: fromConcept,
      to: toConcept,
      type: relationType,
      strength: strength,
    });
  }

  // 概念の取得
  getConcept(conceptId) {
    return this.concepts.get(conceptId);
  }

  // 関連概念の探索（幅優先探索）
  findRelatedConcepts(conceptId, maxDepth = 2) {
    const visited = new Set();
    const related = new Set();
    const queue = [{ concept: conceptId, depth: 0 }];

    while (queue.length > 0) {
      const { concept, depth } = queue.shift();

      if (visited.has(concept) || depth > maxDepth) continue;

      visited.add(concept);

      if (depth > 0) related.add(concept);

      for (const [key, relation] of this.relations) {
        if (relation.from === concept && !visited.has(relation.to)) {
          queue.push({ concept: relation.to, depth: depth + 1 });
        }
        if (relation.to === concept && !visited.has(relation.from)) {
          queue.push({ concept: relation.from, depth: depth + 1 });
        }
      }
    }

    return Array.from(related);
  }

  // 前提知識チェーン（prerequisite関係を再帰的にたどる）
  getPrerequisiteChain(conceptId) {
    const chain = [];
    const concept = this.concepts.get(conceptId);

    if (concept && concept.prerequisites) {
      for (const prereq of concept.prerequisites) {
        chain.push(prereq);
        chain.push(...this.getPrerequisiteChain(prereq));
      }
    }

    return [...new Set(chain)];
  }

  // --- 新規追加: 関連概念を取得 ---
  getRelatedConcepts(conceptId, maxDepth = 1) {
    const concept = this.concepts.get(conceptId);
    if (!concept) return [];

    // 関連概念は relations の type が 'related' または concept の relatedConcepts に基づく
    const relatedSet = new Set();

    // relatedConcepts 配列から直接追加
    if (concept.relatedConcepts && concept.relatedConcepts.length > 0) {
      concept.relatedConcepts.forEach(c => relatedSet.add(c));
    }

    // relations から 'related' タイプを追加
    for (const [key, rel] of this.relations) {
      if (rel.type === 'related') {
        if (rel.from === conceptId) relatedSet.add(rel.to);
        if (rel.to === conceptId) relatedSet.add(rel.from);
      }
    }

    // maxDepth > 1 なら幅優先探索でさらに関連を追加
    if (maxDepth > 1) {
      const bfsRelated = this.findRelatedConcepts(conceptId, maxDepth);
      bfsRelated.forEach(c => relatedSet.add(c));
    }

    return Array.from(relatedSet);
  }

  // デバッグ用：オントロジーの状態を表示
  printOntology() {
    console.log("=== オントロジーの状態 ===");
    console.log("概念数:", this.concepts.size);
    console.log("関係数:", this.relations.size);

    console.log("\n概念一覧:");
    for (const [id, concept] of this.concepts) {
      console.log(`- ${id}: ${concept.label} (${concept.level})`);
    }

    console.log("\n関係一覧:");
    for (const [key, relation] of this.relations) {
      console.log(`- ${relation.from} --[${relation.type}]--> ${relation.to}`);
    }
  }
}
