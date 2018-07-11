# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-06-05 19:01
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion

BUILD_AHEAD_COUNT = { 'small': { 'xenail': 4 } }


def load_sites( app, schema_editor ):
  Site = app.get_model( 'Resource', 'Site' )

  # site = Site( name='site1' )
  # site.domain = 'site1.local'
  site = Site( name='mlxlab' )
  site.domain = 'mlxlab.local'
  site.full_clean()
  site.save()


def load_resources( app, schema_editor ):
  DynamicResource = app.get_model( 'Resource', 'DynamicResource' )
  Site = app.get_model( 'Resource', 'Site' )

  # site = Site.objects.get( name='site1' )
  site = Site.objects.get( name='mlxlab' )

  for size in ( 'small', 'medium' ):
    for name in ( 'ubuntu-trusty', 'ubuntu-xenial', 'ubuntu-bionic', 'centos-6' ):
      dr = DynamicResource( name='{0}-{1}'.format( name, size ) )
      dr.description = '{0} of {1}'.format( name.capitalize(), size.capitalize() )
      dr.blueprint = 'mcp-{0}'.format( name )
      # dr.complex = 'esx'
      dr.complex = 'vca'
      dr.site = site
      try:
        dr.build_ahead_count = BUILD_AHEAD_COUNT[ size ][ name ]
      except KeyError:
        dr.build_ahead_count = 2

      dr.full_clean()
      dr.save()


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='NetworkResource',
            fields=[
                ('name', models.CharField(max_length=40, primary_key=True, serialize=False)),
                ('preference', models.IntegerField(default=100)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('name', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('priority', models.IntegerField(default=50)),
                ('description', models.CharField(max_length=100)),
                ('blueprint', models.CharField(max_length=40)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Site',
            fields=[
                ('name', models.CharField(max_length=40, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='DynamicResource',
            fields=[
                ('resource_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='Resource.Resource')),
                ('build_ahead_count', models.IntegerField(default=0)),
                ('complex', models.CharField(max_length=40)),
            ],
            bases=('Resource.resource',),
        ),
        migrations.CreateModel(
            name='StaticResource',
            fields=[
                ('resource_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='Resource.Resource')),
            ],
            bases=('Resource.resource',),
        ),
        migrations.AddField(
            model_name='resource',
            name='site',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Resource.Site'),
        ),
        migrations.RunPython( load_sites ),
        migrations.RunPython( load_resources ),
    ]
