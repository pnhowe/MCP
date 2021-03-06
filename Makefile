VERSION := $(shell head -n 1 debian/changelog | awk '{match( $$0, /\(.+?\)/); print substr( $$0, RSTART+1, RLENGTH-2 ) }' | cut -d- -f1 )

all:
	./setup.py build

install:
	mkdir -p $(DESTDIR)/var/www/mcp/ui
	mkdir -p $(DESTDIR)/var/www/mcp/static
	mkdir -p $(DESTDIR)/var/www/mcp/api
	mkdir -p $(DESTDIR)/etc/apache2/sites-available
	mkdir -p $(DESTDIR)/usr/lib/mcp/cron
	mkdir -p $(DESTDIR)/usr/lib/mcp/util
	mkdir -p $(DESTDIR)/usr/lib/mcp/setup
	cp -a ui/* $(DESTDIR)/var/www/mcp/ui
	install -m 644 api/mcp.wsgi $(DESTDIR)/var/www/mcp/api
	install -m 644 apache.conf $(DESTDIR)/etc/apache2/sites-available/mcp.conf
	install -m 644 mcp.conf.sample $(DESTDIR)/etc
	install -m 755 lib/cron/* $(DESTDIR)/usr/lib/mcp/cron
	install -m 755 lib/util/* $(DESTDIR)/usr/lib/mcp/util
	install -m 755 lib/setup/* $(DESTDIR)/usr/lib/mcp/setup

	./setup.py install --root=$(DESTDIR) --install-purelib=/usr/lib/python3/dist-packages/ --prefix=/usr --no-compile -O0

version:
	echo $(VERSION)

clean:
	./setup.py clean || true
	$(RM) -r build
	$(RM) dpkg
	$(RM) -r htmlcov
	dh_clean || true
	$(MAKE) -C docs clean

dist-clean: clean

.PHONY:: all install version clean dist-clean

test-distros:
	echo ubuntu-bionic

test-requires:
	echo flake8 python3-pip python3-django python3-psycopg2 python3-cinp python3-dev python3-pytest python3-pytest-cov python3-pytest-django python3-pytest-mock postgresql python3-github

test-setup:
	su postgres -c "echo \"CREATE ROLE mcp WITH PASSWORD 'mcp' NOSUPERUSER NOCREATEROLE CREATEDB LOGIN;\" | psql"
	pip3 install -e .
	cp mcp.conf.sample mcp/settings.py

lint:
	flake8 --ignore=E501,E201,E202,E111,E126,E114,E402,W605 --statistics .

test:
	py.test-3 -x --cov=mcp --cov-report html --cov-report term --ds=mcp.settings -vv mcp

.PHONY:: test-distros test-requires lint test

dpkg-distros:
	echo ubuntu-bionic

dpkg-requires:
	echo dpkg-dev debhelper python3-dev python3-setuptools

dpkg:
	dpkg-buildpackage -b -us -uc
	touch dpkg

dpkg-file:
	echo $(shell ls ../mcp_*.deb):bionic

.PHONY:: dpkg-distros dpkg-requires dpkg-file

doc-distros:
	echo ubuntu-bionic

doc-requires:
	echo mcp-helpers
	$(MAKE) -C docs requires

NAME := mcp
DOC_EXCLUDES := **/*_test.py,**/tests.py
ifeq ($(MAKECMDGOALS),doc)
include /opt/mcp-helpers/Makefile.doc
endif

doc: blackduck.python3 docs/mcp.pdf

docs/mcp.pdf:
	$(MAKE) -C docs mcp.pdf VERSION=$(VERSION) BUILD_NAME=$(BUILD_NAME)

doc-file:
	echo docs/mcp.pdf:34474541

.PHONY:: doc-distros doc-requires doc doc-file

# builds
auto-builds:
	echo installcheck

installcheck-depends:
	echo mcp:dev

installcheck-resources:
	echo mcp:{ \"resource_name\": \"ubuntu-bionic\" }

installcheck:
	apt install -y mcp
	touch installcheck

.PHONY:: auto-builds installcheck-depends installcheck-resources
