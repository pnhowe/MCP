# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2020-08-10 14:50
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import mcp.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Network',
            fields=[
                ('name', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('contractor_addressblock_id', models.IntegerField(unique=True)),
                ('contractor_network_id', models.IntegerField()),
                ('monalythic', models.BooleanField(default=True)),
                ('size', models.IntegerField()),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('key', models.CharField(editable=False, max_length=250, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=50)),
                ('description', models.CharField(max_length=100)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='ResourceInstance',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contractor_structure_id', models.IntegerField(blank=True, null=True, unique=True)),
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
                ('complex_id', models.CharField(max_length=40)),
            ],
            bases=('Resource.resource',),
        ),
        migrations.CreateModel(
            name='DynamicResourceInstance',
            fields=[
                ('resourceinstance_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='Resource.ResourceInstance')),
                ('contractor_foundation_id', models.CharField(blank=True, max_length=100, null=True)),
                ('interface_map', mcp.fields.MapField(blank=True, default=mcp.fields.defaultdict, editable=True)),
                ('dynamic_resource', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='Resource.DynamicResource')),
            ],
            bases=('Resource.resourceinstance',),
        ),
        migrations.CreateModel(
            name='StaticResource',
            fields=[
                ('resource_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='Resource.Resource')),
                ('group_name', models.CharField(max_length=50)),
                ('interface_map', mcp.fields.MapField(blank=True, default=mcp.fields.defaultdict, editable=True)),
            ],
            bases=('Resource.resource',),
        ),
        migrations.CreateModel(
            name='StaticResourceInstance',
            fields=[
                ('resourceinstance_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='Resource.ResourceInstance')),
                ('static_resource', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Resource.StaticResource')),
            ],
            bases=('Resource.resourceinstance',),
        ),
        migrations.AddField(
            model_name='resource',
            name='site',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Resource.Site'),
        ),
        migrations.AddField(
            model_name='network',
            name='site',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Resource.Site'),
        ),
        migrations.AlterUniqueTogether(
            name='resource',
            unique_together=set([('name', 'site')]),
        ),
    ]
