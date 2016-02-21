# Github Nomic

[![Join the chat at https://gitter.im/mburns/nomic](https://badges.gitter.im/mburns/nomic.svg)](https://gitter.im/mburns/nomic?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/mburns/nomic.svg?branch=master)](https://travis-ci.org/mburns/nomic)

This is an instance of the game [Nomic](https://en.wikipedia.org/wiki/Nomic) driven by Github interactions:

* [Players](https://github.com/mburns/nomic/wiki/Player) are Github users that have [forked this repo](#joining-the-game)
* [Rules](https://github.com/mburns/nomic/wiki/Rules) are stored as Markdown documents
* [Votes](https://github.com/mburns/nomic/wiki/Voting) are handled as (+1/-1) comments and discussion in [Pull Requests](https://github.com/mburns/nomic/pulls)

## What is Nomic

> "[Nomic](http://legacy.earlham.edu/~peters/writing/nomic.htm) is a game in which changing the rules is a move. In that respect it differs from almost every other game. The primary activity of Nomic is proposing changes in the rules, debating the wisdom of changing them in that way, voting on the changes, deciding what can and cannot be done afterwards, and doing it. Even this core of the game, of course, can be changed."
> -- Peter Suber, [The Paradox of Self-Amendment](http://dash.harvard.edu/handle/1/10243418)

## Getting Started

Gameplay consists of:

1. [Follow the existing rules](/rule101.md). Questions can be asked via [Issues](https://github.com/mburns/nomic/issues).
2. A Player [proposes a rule-change](https://github.com/mburns/nomic/blob/master/.github/CONTRIBUTING.md) to an existing (or entirely new) rule via Pull Request.
3. [Players](https://github.com/mburns/nomic/wiki/Player) [discuss](/rule111.md) and [vote](/rule105.md) on proposals, earning [points in the process](/SCOREBOARD.md).

The game is won when the first user reaches [+200 points](/rule208.md) or is [stuck on a turn that is an impossible position](/rule213.md) and it cannot be resolved through discussion or jurisdiction within the game.

### Joining the game

1. [Vote](https://github.com/mburns/nomic/blob/master/.github/CONTRIBUTING.md#voting)
2. [Suggests a rule-change](https://github.com/mburns/nomic/blob/master/.github/CONTRIBUTING.md#submit-a-rule-change).

### Minimum rules worth knowing

Here are the basic set of rules that describe the parameters of the game. All rules are subject to change (even 'immutable' rules), as that is central to the game.

1. Players vote on and submit rule-changes to evolve the game
2. Disputes are resolved through [Call For Judgments](https://github.com/mburns/nomic/blob/master/.github/CONTRIBUTING.md#call-for-judgment) by choosing another Player as a nuetral arbitrator.

#### Ground Rules

Rule | Mutable | Brief Description
---- | ------- | -----------------
[101](/rule101.md) | N | All players must always abide by all the rules
[116](/rule116.md) | N | Whatever is not prohibited or regulated by a rule is permitted and unregulated

#### Player Actions

Rule | Mutable | Brief Description
---- | ------- | -----------------
[105](/rule105.md) | Y | Every player is an eligible voter
[207](/rule207.md) | Y | Each player always has exactly one vote
[202](/rule202.md) | Y | One turn consists of: (1) proposing one rule-change and having it voted on, and (2) adding a [computed value](/rule202.md) to your score

#### Rule-changes

Rule | Mutable | Brief Description
---- | ------- | -----------------
[111](/rule111.md) | N | If a rule-change as proposed is unclear then the other players may suggest amendments or argue against the proposal before the vote.
[104](/rule104.md) | N | All rule-changes proposed in the proper way shall be [voted on](https://github.com/mburns/nomic/wiki/Voting)
[205](/rule205.md) | Y | An adopted rule-change takes full effect at the moment of the completion of the vote that adopted it.

#### End-game

Rule | Mutable | Brief Description
---- | ------- | -----------------
[208](/rule208.md) | Y | The **winner** is of the Round first Player to achieve 200 (positive) points.
[213](/rule213.md) | Y | If the rules are changed so that further play is impossible, or if by the Judge's best reasoning, not overruled, a move appears equally legal and illegal, then the first player unable to complete a turn is the **winner**.

### Meta game

The [Wiki](https://github.com/mburns/nomic/wiki) and [Issues](https://github.com/mburns/nomic/issues) are intended to be 'out of bounds' or meta-game (in so much as such a thing is possible in Nomic) and used for coordination and clarification of the game's process by Players and spectators alike.

## Influences

These document's formatting was inspired by [chef-rfc](https://github.com/chef/chef-rfc).

This repository was inspired by a [Hacker News comment](https://news.ycombinator.com/item?id=4889988) by [ChrisAcky](http://acky.vze.com/) and follows in the footsteps of other Nomic Github games:

* [aasmith/nomic](https://github.com/aasmith/nomic)
* [alokmenghrajani/nomic](https://github.com/alokmenghrajani/nomic)
* [fkh/nomic](https://github.com/fkh/nomic)

## Copyright

All information on this site is public domain and may be distributed or copied unless otherwise specified.
