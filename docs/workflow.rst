Workflow
========

MCP will periodically poll Git/GitHub for new commits to all branches detected.  NOTE: GitHub Pull Requests
will appear as branches named `_PR#`.  MCP pulls the latest commit to an internal staging git repo, from there it
clones a copy and run a vew make commands (detailed latter).  The resources that are spooled up by MCP clone from this
internal staging git repo.

pseudo code of the project scanner::

  for each project:
    if project has commit records that are not done:
      skip project

    for each job in project:
      if the job is manual and has not completed running:
        skip project

      if the job is automatic and has not reported it's results:
        skip project

    update internal git copy from upstream (git pull)

    for each branch:
      if a commit record exist for the latest commit on the branch:
        skip branch

      create a commit record for this commit

      checkout branch to a working directory

      if there isn't a Makefile or the Makefile is invalid:
        fail the commit
        skip branch

      retrieve the version by running `make version`

      if there isn't a version:
        fail the commit
        skip the branch

      store the version number in the commit record

      if branch is the release branch:
        increment the project build counter

      retrieve the list of resources for test by running `make test-blueprints`

      for packaging in 'dpkg', 'rpm', 'respkg', 'resource':
        retrieve list of resources for packaging by running `make <packaging>-blueprints`

      if branch is the release branch:
        retrieve list of resources for documentation by running `make doc-blueprints`

      if branch is the release branch:
        retrieve list of auto(integration testing) builds by running `make auto-builds`
        retrieve list of manual builds by running `make manual-builds`

      for each of the return builds:
        retrieve list of package dependencies by running `make <build>-depends`
        retrieve list of resources by running `make <build>-resources`
        retrieve list of networks by running `make <build>-networks`


After the commit records are created, MCP goes over targets and allocates resources.  The
targets are `test`, packaging ( `dpkg`, `rpm`, `respkg`, `resource` ) and if the commit
is for the release branch `doc`.

pseudo code for the resource running the resource that has been created for the job::

  clone the repo from the internal git
  checkout the branch/commit

  retrieve the required packages by running `make <target>-requires`
  install the packages (via yum/apt)

  clean by running `make clean`

  setup for target by running `make <target>-setup`

  if target is `test`:
    do lint check with `make lint`
    to unit/self test(s) with `make test`

  else if packaging (ie: 'dpkg', 'rpm', 'respkg', 'resource'):
    build the package with `make <target>`
    retrieve the list of files by `make <target>-file`
    if branch is the release branch::
      upload file(s) to packrat

  else if `doc` and branch is the release branch::
    build the documents with `make doc`
    retrieve the list of files with `make doc-file`
    upload file(s) to confluence(not fully implemented yet)

  else:
    do the target with `make <target>`

MCP will then record the results for each of the target stages back to the commit.  If any stage fails,
processing stops at that point.  If the test coverage is outputted in a format that Nullunit understands,
the coverage value is also stored in the commit.  When the commit is finished processing, a summary of the
results is posted as a comment to the commit(if the SCM is github/gitlab), if it is a PR/MR branch then MCP
sets the status check, which enables protection on PR merging to block on test/lint/packaging results.  If
the coverage drops from commit to the next, there is a warning posted on the commit message.  If the commit
is on the release branch, a tag of the version is tagged to the commit.
