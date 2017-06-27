#!/bin/bash

##
# Automated project release using git flow
# https://github.com/petervanderdoes/gitflow-avh
#
# Usage:
#   ./release.sh [-p] [-m <tag_message>] <version>
#

# Whether to push changes to origin or not (-p)
# Defaults to false
PUSH_CHANGES=false

# Message on tagged release (-m <tag_message>)
# See https://git-scm.com/book/en/v2/Git-Basics-Tagging
TAG_MESSAGE=""

# Fetch input options
while getopts "m:p" opt; do
  case $opt in
    m) TAG_MESSAGE="$OPTARG";;
    p) PUSH_CHANGES=true;;
    \?) echo "Invalid option: -$OPTARG" >&2; exit 1 ;;
    :) echo "Option -$OPTARG requires an argument." >&2; exit 1 ;;
    *) break ;;
  esac
done

# Release version
VERSION=${@:$OPTIND:1}

if [ "$VERSION" == "" ] ; then
  echo "Usage: $ ./release.sh [-p] [-m <tag_message>] <version>">&2
  exit 1
fi

# Some completely unnecessary colors to spice things up
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No color

# Prints an ominous message and exits with a status of 1
# if the first argument is not zero
function bail {
  if [ $1 -ne 0 ]; then
    echo -e "[${RED}ERR${NC}] Something went wrong (see above for details) \xE2\x98\xA0.">&2
    exit 1
  fi
}

# Bypass git commit message editing after merge
export GIT_MERGE_AUTOEDIT=no

# Initialize git flow repository (will use defaults)
git flow init -d

# Start release
git flow release start -F $VERSION
bail $?

# Bump version on package.json and commit changes
npm version --no-git-tag-version --allow-same-version $VERSION
git commit -nam 'Bump release version'

# Finish current release
if [ "$TAG_MESSAGE" != "" ]; then
  git flow release finish $VERSION -m "$TAG_MESSAGE"
  bail $?
else
  git flow release finish $VERSION
  bail $?
fi

# Push changes to origin
if "$PUSH_CHANGES"; then
  git push origin develop master --tags
  bail $?
fi

# Reset git merge autoedit feature
unset GIT_MERGE_AUTOEDIT

echo -e "[${GREEN}OK${NC}] Your $VERSION release is done! \xF0\x9F\x8E\x89"
