# Contributing

This is a collaborative, Open project, all contributions are welcome.

## Join the Nomic

[Fork this repo](https://github.com/mburns/nomic.git) and you will be an active Player.

Once you've join the game, you can start playing by voting or submiting a rule-change via Pull Requst.

## Voting

Players can discuss and vote on [pending rule-changes](https://github.com/mburns/nomic/pulls). A vote is a comment that consists of simply `+1` or `-1`, nothing more. A comment is conversation in-thread that is about the specific rule-change proposal in question.

When voting completes, tallies will be posted, rules updated, and points rewarded to participating Players.

## Submit a Rule-Change

*Don't worry about perfect formatting. We can fix it before merging.*

Using the template provided in [ruleXXX](/templates/ruleXXX.md), create a new file and rename it to a unique `rule3##.md` and edit the contents to reflect your desired rule-change proposal. Open a Pull Request to begin a discussion and vote on the proposal. Commits should be squashed and the commit message should be well formed (see: [rule303](/rule303.md)).

Amendments and discussion may take place in the Pull Request to refine the proposal.

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

## Call for Judgment

To resolve rule disputes or disagreements in-game, another Player can be [chosen as a Judge](/rule212.md) to make a ruling on the specific disgreement.

To submit a CFJ, create a new file and rename it to a unique `cfj0XX.md` and edit it accordingly. Open a Pull Request to begin the judgment.

```markdown
---
CFJ: XXX
Author: John Doe <jdoe@example.com>
Judge: Jane Smith <jsmith@example.com>
Judgment: <True, False>
Status: Draft
---

# Claim

This is an example claim.

## Justification

# Judgment

<to be written by the Judge>

# Copyright

This work is in the public domain. In jurisdictions that do not allow for this, this work is available under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). To the extent possible under law, the person who associated [CC0](https://creativecommons.org/publicdomain/zero/1.0/) with this work has waived all copyright and related or neighboring rights to this work.

```

# Bug Reports and Feedback

Please file an [Issue](https://github.com/fkh/nomic/issues) labeled [BUG] if you see errors, typos, missing documentation or feature requests.
