# Makefile

# Define your commit message here, or you can pass it as a parameter when running make.
# For example, you can run 'make git-push m="Your commit message"'.
m ?= "Default commit message"

.PHONY: git-push

git-push:
	@echo "Committing and pushing changes..."
	git add .
	git commit -m "$(m)"
	git push -u origin develop