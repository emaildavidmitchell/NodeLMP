
import wikipedia, json, operator, re, sys
import nltk.tag.stanford as st
from fuzzywuzzy import fuzz
from SPARQLWrapper import SPARQLWrapper, JSON

def get_article_label(query,sim):
	labels = wikipedia.search(query)[:3]
	if len(labels) > 0:
		aliases = [[alias for alias in get_aliases(label.replace("\"","'"))] for label in labels]
		for i in range(len(labels)):
			aliases[i].append(labels[i])
		aliases = [list(map(lambda token: [token,similarity(token,query)],alias)) 
					for alias in aliases]
		aliases = [max(alias,key=operator.itemgetter(1)) for alias in aliases]
		ms = max(aliases,key=operator.itemgetter(1))
		if ms[1] > sim:
			print(labels[aliases.index(ms)])
			sys.stdout.flush()	
		else:
			print('undefined')	
			#return labels[aliases.index(ms)]
	else:
		print('undefined')
	#return None

def get_aliases(label):
	query = (""" 
			    select distinct ?l where { ?v <http://dbpedia.org/ontology/wikiPageRedirects> ?s . ?s <http://www.w3.org/2000/01/rdf-schema#label> "%s"@en . ?v <http://www.w3.org/2000/01/rdf-schema#label> ?l}
			""" % label)
	results = query_dbpedia(query)
	results = [result[0] for result in results]
	return results

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

def similarity(term1,term2):
	return fuzz.token_sort_ratio(term1,term2)

get_article_label(sys.argv[1],80)