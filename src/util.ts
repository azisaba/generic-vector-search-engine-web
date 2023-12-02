export type QueryResult = {
    results: Array<Match>;
}

export type Match = {
    pageContent: string;
    metadata: Record<string, any>;
    score: number;
}

export const fetchMatches = async (endpoint: string, query: string, top_k: number, offset: number): Promise<QueryResult> => {
    return await fetch(`${endpoint}?query=${encodeURIComponent(query)}&top_k=${top_k + offset}`)
        .then(res => res.json())
        .then((res: QueryResult) => {
            res.results = res.results.slice(offset, offset + top_k)
            return res
        })
}
