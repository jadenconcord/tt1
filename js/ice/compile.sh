#!/bin/bash

compile() {

    echo "// $(date)" > ice.js

    cat modules/render/functions.js >> ice.js
    cat modules/render/devmode.js >> ice.js
    cat modules/render/blocks.js >> ice.js
    cat modules/render/render.js >> ice.js
    cat modules/interface/template.js >> ice.js
    cat modules/interface/popup.js >> ice.js
    cat modules/interface/form.js >> ice.js

    # Does not work because of the file order
    # for file in modules/*
    # do
    #     cat $file >> ice.js
    # done
}

if [ "$1" = '--watch' ]
then
    echo "Watching for changes in ICE.JS modules."
    echo
    while true
        do

        ATIME=`stat -c %Z modules/*/*`

        if [[ "$ATIME" != "$LTIME" ]]

        then
            date -ud "@$SECONDS" "+%H:%M:%S ICE.JS COMPILED"
            ./compile.sh
            LTIME=$ATIME
        fi
        sleep .1 
    done

else
    compile
fi