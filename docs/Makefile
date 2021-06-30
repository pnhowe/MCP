
all:

clean:
	$(RM) api.rst
	$(RM) mcp.pdf
	$(RM) -r build

api.rst:
	pip3 install -e ..
	cp ../mcp.conf.sample ../mcp/settings.py
	/bin/bash -x -e -c 'function cleanup { kill $$(cat /tmp/mcp_api_server.pid); rm /tmp/mcp_api_server.pid ; }; \
	../lib/api_server/api_server.py & echo $$! > /tmp/mcp_api_server.pid; \
	trap cleanup EXIT; \
	sleep 5; \
	cinp-codegen -s MCP -d . http://127.0.0.1:8888/api/v1/; \
	sleep 2;'

requires:
	echo python3-pip python3-sphinx texlive texlive-latex-extra cinp-utils python3-django python3-psycopg2 python3-cinp python3-github python3-gunicorn python3-werkzeug

build/mcp.tex: index.rst intro.rst stages.rst workflow.rst api.rst
	sphinx-build -b latex -D latex_paper_size=letter . build

mcp.pdf: build/mcp.tex
	cd build && pdflatex mcp.tex > /dev/null
	cp build/mcp.pdf .

.PHONY:: all clean requires
