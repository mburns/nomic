# Nomic

This is an instance of the game [Nomic](https://en.wikipedia.org/wiki/Nomic) driven by Github interactions:

* [Rules](https://github.com/mburns/nomic/blob/master/ruleXXX.md) are stored as Markdown documents
* [Players](#Joining-the-game) are Github users that have forked this repo
* Votes are handled as (+1/-1) comments in [Pull Requests](https://github.com/mburns/nomic/pulls)

## What is Nomic?

> "[Nomic](http://legacy.earlham.edu/~peters/writing/nomic.htm) is a game in which changing the rules is a move. In that respect it differs from almost every other game. The primary activity of Nomic is proposing changes in the rules, debating the wisdom of changing them in that way, voting on the changes, deciding what can and cannot be done afterwards, and doing it. Even this core of the game, of course, can be changed."
> -- Peter Suber, [The Paradox of Self-Amendment](http://dash.harvard.edu/handle/1/10243418)

## Getting Started

Gameplay consists of:

1. [Follow the existing rules](/rule101.md)
2. The person whose [turn](/rule201.md) it is [propose a rule-change](/rule104.md) to an existing (or entirely new) rule
3. Players [discuss](/rule111.md) and [vote](/rule105.md) on those proposals, earning points in the process
4. Some rules (Immutable, #101-199) take precedence over other rules (2xx and 3xx), to give the game consistency and structure

The game is won when the first user reaches [200 points](/rule208.md) or is [stuck on a turn that is an impossible position](/rule213.md) and it cannot be resolved through discussion or jurisdiction.

### Joining the game

1. Create a fork of [this repo](https://github.com/mburns/nomic)
2. Submit a [Pull Request](https://github.com/mburns/nomic/compare) that adds your Github Username to the [SCOREBOARD](https://github.com/mburns/nomic/blob/master/SCOREBOARD)

### Minimum rules worth knowing

Here are the basic set of rules that describe the parameters of the game. These rules are subject to change, as that is central to the game.

Rule | Mutable | Brief Description
---- | ------- | -----------------
[101](/rule101.md) | N | All players must always abide by all the rules
[104](/rule104.md) | N | All rule-changes proposed in the proper way shall be voted on
[105](/rule105.md) | N | Every player is an eligible voter
[107](/rule107.md) | N | No rule-change may have retroactive application.
[111](/rule111.md) | N | If a rule-change as proposed is unclear then the other players may suggest amendments or argue against the proposal before the vote.
[113](/rule113.md) | N | A player always has the option to forfeit the game
[115](/rule115.md) | N | Rule-changes that affect rules needed to allow or apply rule-changes are as permissible as other rule-changes
[116](/rule116.md) | N | Whatever is not prohibited or regulated by a rule is permitted and unregulated
[201](/rule201.md) | Y | players shall alternate in alphabetical order
[202](/rule202.md) | Y | One turn consists of: (1) proposing one rule-change and having it voted on, and (2) adding a [computed value]() to their score
[205](/rule205.md) | Y | An adopted rule-change takes full effect at the moment of the completion of the vote that adopted it.
[207](/rule207.md) | Y | Each player always has exactly one vote.
[208](/rule208.md) | Y | The **winner** is the first player to achieve 200 (positive) points.
[213](/rule213.md) | Y | If the rules are changed so that further play is impossible, or if by the Judge's best reasoning, not overruled, a move appears equally legal and illegal, then the first player unable to complete a turn is the **winner**.

### Submitting a rule

Copy the [ruleXXX.md](https://github.com/mburns/nomic/blob/master/proposals/ruleXXX.md) file and rename it to a unique `rule3##.md` and edit the contents to reflect your desired rule-change proposal. Open a Pull Request to begin a discussion and vote on the proposal.

```markdown
---
RULE: XXX
Author: John Doe <jdoe@example.com>
Status: Draft
Type: <Immutable, Mutable>
<Amends: ruleXXX>
---

# Rule

This is an example rule that has no effect.

# Copyright

This work is in the public domain. In jurisdictions that do not allow for this, this work is available under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). To the extent possible under law, the person who associated [CC0](https://creativecommons.org/publicdomain/zero/1.0/) with this work has waived all copyright and related or neighboring rights to this work.
```

### Meta game

The [Wiki](https://github.com/mburns/nomic/wiki) and [Issues](https://github.com/mburns/nomic/issues) are intended to be 'out of bounds' or meta-game (if so much as such a thing is possible in Nomic) and used for coordination and clarification of the game's process.

## Influences

This document's formatting was inspired by [chef-rfc](https://github.com/chef/chef-rfc).

This repository was inspired by a [Hacker News comment](https://news.ycombinator.com/item?id=4889988) and follows in the footsteps of past nomic github games:

* https://github.com/aasmith/nomic
* https://github.com/alokmenghrajani/nomic
* https://github.com/fkh/nomic

# Copyright

All information on this site is public domain and may be distributed or copied unless otherwise specified.
