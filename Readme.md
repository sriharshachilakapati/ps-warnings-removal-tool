# PureScript warnings removal tool

A small tool to automatically iterate over the PureScript code bases and remove most of the common warnings that arise in development.

This is a small tool for convenience. Based upon the PureScript IDE Server, this automatically corrects most of the warnings that usually occur in the project.

Thanks to Aravind Mallapureddy for the initial development of the project.

## Instructions

Be warned that this is experimental and might introduce new errors. This is developed out of interest and personal use cases, and is not to be run on production code.

~~~sh
$ git clone https://github.com/sriharshachilakapati/ps-warnings-removal-tool/
$ cd ps-warnings-removal-tool
$ npm install -g .
~~~

Now go into your project directory and run the tool from the root project directory.

~~~sh
$ ps-remove-warnings [optional/path/to/project/directory]
~~~

That is all there is to it, everything else is taken care by the tool.
