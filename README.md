# Nomic

This is an instance of the game [Nomic](https://en.wikipedia.org/wiki/Nomic) driven by Github interactions:

* [Rules](https://github.com/mburns/nomic/blob/master/rule000.md) are stored as Markdown documents.
* [Members](#Joining-the-game) are Github users that have forked this repo.
* Votes are handled as (+1/-1) comments in [Pull Requests](https://github.com/mburns/nomic/pulls).

## What is Nomic?

> "[Nomic](http://legacy.earlham.edu/~peters/writing/nomic.htm) is a game in which changing the rules is a move. In that respect it differs from almost every other game. The primary activity of Nomic is proposing changes in the rules, debating the wisdom of changing them in that way, voting on the changes, deciding what can and cannot be done afterwards, and doing it. Even this core of the game, of course, can be changed."
> -- Peter Suber, [The Paradox of Self-Amendment](http://dash.harvard.edu/handle/1/10243418)

## Getting Started

### Joining the game

1. [Create a fork](#fork-destination-box) of [this repo](https://github.com/mburns/nomic).
2. [Submit a Pull Request](https://github.com/mburns/nomic/compare) that adds your name to the [SCOREBOARD](https://github.com/mburns/nomic/blob/master/SCOREBOARD). [Players start with 0 points](https://github.com/mburns/nomic/blob/master/rule201.md).

### Submitting a rule

Copy the [rule000.md](https://github.com/mburns/nomic/blob/master/drafts/rule000.md) file and rename it to a unique `rule3##.md` and edit the contents to reflect your desired rule-change proposal. Open a Pull Request to begin a discussion and vote on the proposal.

```markdown
---
RULE: 000
Author: John Doe <jdoe@example.com>
Status: Draft
Type: <Immutable, Mutable>
<Amends: ruleXXX>
---

# Rule

This is an example rule that has no effect.

# Copyright

I dedicate any and all copyright interest in this software to the public domain. I make this dedication for the benefit of the public at large and to the detriment of my heirs and successors. I intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.
```

### Meta game

The [Wiki](https://github.com/mburns/nomic/wiki) and [Issues](https://github.com/mburns/nomic/issues) are intended to be 'out of bounds' or meta-game (if so much as such a thing is possible in Nomic) and used for coordination and clarification of the game's process.

## Influences

This document's formatting was inspired by [chef-rfc](https://github.com/chef/chef-rfc).

This repository was inspired by a [Hacker News comment](https://news.ycombinator.com/item?id=4889988) and follows in the footsteps of past nomic github games:

* https://github.com/aasmith/nomic
* https://github.com/alokmenghrajani/nomic
* https://github.com/fkh/nomic
