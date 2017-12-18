
#!/usr/bin/env python3

import wikipedia, json, operator, re, sys
import nltk.tag.stanford as st
from fuzzywuzzy import fuzz
from SPARQLWrapper import SPARQLWrapper, JSON


def get_article_uri(label):
	query = (""" 
			    select distinct ?s where {?s rdfs:label "%s"@en FILTER regex(?s, "dbpedia.org/resource") }
			""" % label)
	results = query_dbpedia(query)
	results = [result[0] for result in results]
	if len(results) > 0:
		print(label + "," +results[0],file=open("./article_uris.txt","a"))

def query_dbpedia(query):
	sparql = SPARQLWrapper("http://dbpedia.org/sparql")
	sparql.setQuery(query)
	sparql.setReturnFormat(JSON)
	results = []
	results = sparql.query().convert()

	if len(results) > 0:
		result_vars = results['head']['vars']
		results = [[result[var]["value"] for var in result_vars] 
			for result in results["results"]["bindings"]]
	return results

articles = open("./articles.txt").read()
articles = articles.split("\n")
for article in articles:
	get_article_uri(article)
