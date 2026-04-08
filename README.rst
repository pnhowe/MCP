MCP
===

System for Unit Testing, Packaging, Integration Testing and Documentation.

The only "Configuration" is to register the project with MCP, all other configuration, scripts, etc are via the Makefile(s)
in the code of the project.

See the docs dir for more info.


Install
-------

as root

from package::

  dpkg -i mcp_*.deb

from source::

  DESTDIR=/ make install

then::

  su postgres -c "echo \"CREATE ROLE mcp WITH PASSWORD 'mcp' NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN;\" | psql"
  su postgres -c "createdb -O mcp mcp"
  /usr/lib/mcp/util/manage.py migrate
  /usr/lib/mcp/setup/setupWizard

Now we need to create the MCP user on the contractor host::

  /usr/lib/contractor/util/manage.py shell
  from django.contrib.auth.models import User, Permission
  user = User.objects.create_user('mcp', 'mcp@mcp.test', 'mcp')
  user.user_permissions.add( Permission.objects.get( codename='view_site', content_type__app_label='Site' ) )
  user.user_permissions.add( Permission.objects.get( codename='view_network', content_type__app_label='Utilities' ) )
  user.user_permissions.add( Permission.objects.get( codename='view_addressblock', content_type__app_label='Utilities' ) )
  user.user_permissions.add( Permission.objects.get( codename='can_create_foundation', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='add_structure', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='delete_structure', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='add_realnetworkinterface', content_type__app_label='Utilities' ) )
  user.user_permissions.add( Permission.objects.get( codename='add_address', content_type__app_label='Utilities' ) )
  user.user_permissions.add( Permission.objects.get( codename='can_create_foundation_job', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='can_create_structure_job', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='change_structure', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='can_config_structure', content_type__app_label='Building' ) )
  user.user_permissions.add( Permission.objects.get( codename='add_structurebox', content_type__app_label='PostOffice' ) )
  user.user_permissions.add( Permission.objects.get( codename='add_foundationbox', content_type__app_label='PostOffice' ) )
  user = User.objects.create_user('nullunit', 'nullunit@mcp.test', 'nullunit')

# also need the delete foundation

For the packrat host, the MCP user should have been created by they setupWizard.

you will want to setup the starting resources, first add a site, the site name (test1), should match the site id in
contractor you want to use::

  /usr/lib/mcp/util/manageResources --site-add --name test1

next add the network
in contractor you want to use::

  /usr/lib/mcp/util/manageResources --network-add --site test1 --network 1 --address-block 1

now the contractor complex to host the dynamic resources, the id (proxmox) should be the complex id on contractor.  This should be
a ESX/VCenter, Proxmox, or Virtualbox complex.

  /usr/lib/mcp/util/manageResources --dynamic-resource-add --site test1 --name proxmox --description "Proxmox VM"

and finally, update the built in project (this project is used for the automatic builds triggered by test/lint, package, etc
builds) with the blueprint id from contractor::

  /usr/lib/mcp/util/manageProjects --update-builtin ubuntu-noble-base --site test

To speed things up a bit, you can tell MCP to pre-build some dynamic resources::

  ./manageResources --dynamic-resource-build-ahead --name vbox --blueprint ubuntu-noble-base --build-ahead-count 1

Now to add a Project to track::

  /usr/lib/mcp/util/manageProjects --add --type git --name myproject
