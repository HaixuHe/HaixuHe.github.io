import json
import requests
import os
import time

def load_data():
    """加载data.json文件"""
    with open('data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """保存data.json文件"""
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_citations_from_semantic_scholar(doi, api_key=''):
    """从Semantic Scholar API获取引用量（优先）"""
    if not doi:
        return None

    try:
        url = f"https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}?fields=citationCount"
        headers = {}
        if api_key:
            headers['x-api-key'] = api_key

        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            count = data.get('citationCount')
            if count is not None:
                return count
        elif response.status_code == 404:
            print(f"  S2: DOI {doi} 未在Semantic Scholar中找到")
        else:
            print(f"  S2: 状态码 {response.status_code}")
        return None
    except Exception as e:
        print(f"  S2查询出错: {str(e)}")
        return None

def get_citations_from_openalex(doi):
    """从OpenAlex API获取引用量（备用）"""
    if not doi:
        return None

    try:
        url = f"https://api.openalex.org/works/https://doi.org/{doi}"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            count = data.get('cited_by_count')
            if count is not None:
                return count
        else:
            print(f"  OpenAlex: 状态码 {response.status_code}")
        return None
    except Exception as e:
        print(f"  OpenAlex查询出错: {str(e)}")
        return None

def update_citations():
    """更新所有论文的引用量（优先Semantic Scholar，备用OpenAlex）"""
    data = load_data()

    if 'publications' not in data:
        print("data.json中没有publications字段")
        return

    s2_api_key = os.environ.get('S2_API_KEY', '')
    if s2_api_key:
        print("已加载 Semantic Scholar API Key")
    else:
        print("未配置 S2_API_KEY，将以无认证模式访问 Semantic Scholar（受速率限制）")

    publications = data['publications']
    total_papers = len(publications)
    total_updated = 0

    print(f"\n开始更新 {total_papers} 篇论文的引用量（优先 Semantic Scholar，备用 OpenAlex）...\n")

    for i, paper in enumerate(publications):
        doi = paper.get('doi', '')
        title = paper.get('title', 'Unknown')[:50]

        if not doi:
            paper['citations'] = 0
            print(f"[{i+1}/{total_papers}] {title}... 无DOI，跳过")
            continue

        # 优先 Semantic Scholar
        citations = get_citations_from_semantic_scholar(doi, s2_api_key)
        source = 'Semantic Scholar'

        if citations is None:
            # 备用 OpenAlex
            citations = get_citations_from_openalex(doi)
            source = 'OpenAlex'

        if citations is None:
            citations = paper.get('citations', 0)  # 保持原值
            source = '保持原值'

        paper['citations'] = citations
        total_updated += 1
        print(f"[{i+1}/{total_papers}] {title}... 引用量: {citations} (来源: {source})")

        # 避免触发速率限制
        if s2_api_key:
            time.sleep(0.5)
        else:
            time.sleep(1.0)

    save_data(data)
    print(f"\n更新完成！共更新 {total_updated} 篇论文的引用量")

if __name__ == '__main__':
    update_citations()
