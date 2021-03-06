---
RULE: 309
Author: Peter Suber <peters@earlham.edu>
Status: Accepted
Type: Immutable
Tags: player, vote
---

# Rule

Every player is an eligible voter.

Eligible voters may choose to participate in votes on rule-changes or abstain. If no action is taken, a voter is considered to have abstained and is neither for or against the proposal.

Quorum is half of all active registered players. Votes on rule-changes take effect if and only if quorum is reached.

```javascript
let n = number of active players
let v = number of votes
let q = Floor(n / 2) + 1

if v >= q, quorum is reached.
```

## References

* [Chiark Nomic, rule 201](http://www.chiark.greenend.org.uk/~dricher/Nomic/CN/rules.html)

# Copyright

[Copyright](http://legacy.earlham.edu/~peters/copyrite.htm) © 1990, Peter Suber
