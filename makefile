BUILDDIR = dist
SRCDIR = src

# Run the full build of application
all: clean_files dojo copy clean

# Clean up the output directory
clean_files:
	rm -rfv $(BUILDDIR)/*

# Run the Dojo build via node command line
dojo:
	node dojoconfig.js load=build --profile build.profile.js --releaseDir ../$(BUILDDIR)

# Copy a prepared built.html as index.html to output directory
copy:
	cp $(SRCDIR)/built.html $(BUILDDIR)/index.html
	cp -R $(BUILDDIR)/esri/assets $(BUILDDIR)/assets
	rm -rfv $(BUILDDIR)/esri/assets/

# Remove the uncompressed output files form Dojo build
clean:
	find $(BUILDDIR) -name "*.uncompressed.js" -type f -delete
