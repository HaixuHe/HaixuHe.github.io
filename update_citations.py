import json
import requests
import os

def load_data():
    """加载data.json文件"""
    with open('data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """保存data.json文件"""
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_citations_from_openalex(doi):
    """从OpenAlex API获取引用量"""
    if not doi or doi == '':
        return 0
    
    try:
        url = f"https://api.openalex.org/works/https://doi.org/{doi}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('cited_by_count', 0)
        else:
            print(f"无法获取DOI {doi} 的引用量，状态码: {response.status_code}")
            return 0
    except Exception as e:
        print(f"查询DOI {doi} 时出错: {str(e)}")
        return 0

def update_citations():
    """更新所有论文的引用量"""
    data = load_data()
    
    if 'publications' not in data:
        print("data.json中没有publications字段")
        return
    
    publications = data['publications']
    total_papers = len(publications)
    total_updated = 0
    
    print(f"开始更新 {total_papers} 篇论文的引用量...")
    
    for i, paper in enumerate(publications):
        doi = paper.get('doi', '')
        
        if doi:
            citations = get_citations_from_openalex(doi)
            paper['citations'] = citations
            total_updated += 1
            print(f"[{i+1}/{total_papers}] {paper.get('title', 'Unknown')[:50]}... 引用量: {citations}")
        else:
            paper['citations'] = 0
            print(f"[{i+1}/{total_papers}] {paper.get('title', 'Unknown')[:50]}... 无DOI，跳过")
    
    save_data(data)
    print(f"\n更新完成！共更新 {total_updated} 篇论文的引用量")

if __name__ == '__main__':
    update_citations()
