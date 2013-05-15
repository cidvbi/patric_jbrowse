rm -rf docs/jsdoc *-min.js release-notes.html;
git clean -fdx
mkdir /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev/;  cp -r `ls -1d * | grep -v JBrowse-patric-dev` /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev/;
rm -rf /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//src/*/.git /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//JBrowse-patric-dev /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//src/util /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//build;
#perl -i -pE 's!(?<=BUILD_SYSTEM_JBROWSE_VERSION);! = "patric";!' /Users/hyun/dev/git-test/jbrowse/src/JBrowse/Browser.js;
#perl -MDateTime -i -pE 'BEGIN{ $datestring = DateTime->from_epoch( epoch => time(), time_zone => DateTime::TimeZone->new(name => "local"))->format_cldr(q|yyyy-MM-dd HH:mm:ss VVVV|)}; s/\{\{\$NEXT\}\}\s*/patric     $datestring\n/m' /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//release-notes.txt
#cp /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//release-notes.txt .;
#perl -i -pE 'say "{{\$NEXT}}\n" unless $x++' release-notes.txt;
# zip up the dev release
#zip -q --symlinks -r JBrowse-patric-dev.zip JBrowse-patric-dev/;
# run the dojo build in the full dir to minify
( cd /Users/hyun/dev/git-test/jbrowse/src/util/buildscripts && node ../../dojo/dojo.js load=build --require "/Users/hyun/dev/git-test/jbrowse/build/init.js" --profile "/Users/hyun/dev/git-test/jbrowse/src/JBrowse/JBrowse.profile.js" --releaseDir "/Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev//src"; )
cp -a /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev/ /Users/hyun/dev/git-test/jbrowse/JBrowse-patric/;
for P in src docs/jsdoc tests tests_extended build; do \
	    rm -rf /Users/hyun/dev/git-test/jbrowse/JBrowse-patric/$P; \
	done;
for P in 	src/wig2png \
			src/dojo/dojo.js \
			`find src/ -name nls -and -type d -and -not -wholename '*_editor/*' -and -not -wholename '*/tests/*'` \
			src/dojo/resources \
			src/dojox/grid \
			src/dojox/gfx/vml.js \
			src/dojox/form/resources \
			src/dojox/gfx/vml_attach.js \
			src/dijit/themes/tundra \
			src/dijit/form/templates \
			src/dijit/icons \
			src/dijit/templates \
			src/JBrowse \
			src/perl5 \
			src/dgrid/css \
	; do \
	    mkdir -p `dirname /Users/hyun/dev/git-test/jbrowse/JBrowse-patric/$P`; \
	    if [ -d $P ]; then \
		    cp -r /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev/$P /Users/hyun/dev/git-test/jbrowse/JBrowse-patric/`dirname $P`; \
	    else \
		    cp -r /Users/hyun/dev/git-test/jbrowse/JBrowse-patric-dev/$P /Users/hyun/dev/git-test/jbrowse/JBrowse-patric/$P; \
	    fi;\
	done
#zip -q --symlinks -r JBrowse-patric.zip JBrowse-patric/;
