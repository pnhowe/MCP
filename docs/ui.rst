UI
==

The MCP UI is broken down into the *Projects* and *Globals* tabs.


Projects
--------

This will list all the projects registered with MCP.  If there is a Green Checkmark, that means the last commit on the
release build succeeded.  If there is a Red X, it Failed... and exclamation point means the doc stage failed, or the Makefile
had errors.  If there is rotating dots, that means there is a related running job or commit still in processes.

The date is when the last commit related to the Checkmark/X was processed.  Under the Status Icon is an icon indicating
if it is a Git, GitHub or GitLab project.

There is also a search box that will subset the project list.

If you click on a project it will load on the right.  There are 5 tabs here, Latest Commit, Commit History, Running Jobs,
Queued Jobs and Job Builds.

Latest Commit
~~~~~~~~~~~~~

Commit History
~~~~~~~~~~~~~~

Running Jobs
~~~~~~~~~~~~

These are the currently executing and recently complete jobs.  If the icon next to the job header is a Circle, it was a
manually created job, if it a set of gears, it was automatically created.

Under the header is a list of the resources associated with the build job
