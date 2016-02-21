---
RULE: 303
Author: Justin Gallardo <justin.gallardo@gmail.com>
Status: Draft
Type: Mutable
---

# Rule

All rule proposals and amendments must adhere to the commit format set
forth below.

For proposals:

```markdown
propose(<rule number>): Short, imperative description of the new rule.

A longer description of the rule if it is needed. The short description
should be limited to 72 characters or less.
```

Example:

```markdown
propose(303): Define commit message format.

This rule defines a standard format for commit messages used when
proposing new rules or amending existing rules.
```

For amendments:

```markdown
amend(<rule number>): Short, imperative description of the rule change.

A longer description of the rule if it is needed. The short description
should be limited to 72 characters or less.
```

Example:

```markdown
amend(303): Increase the maximum characters in first line of commit msg.

This increases the maximum length of the first line in a commit message
to 80 characters up from 72 characters.
```

For judgments:

```markdown
CFJ(<judgment number>): Short, imperative description of the CFJ

A longer description of the claim or judgment if it is needed. The short description should be limited to 80 characters or less.
```

Example:

```markdown
CFJ(1): Player Foo violated Rule ###

I claim that Player Foo violated Rule ### when X, Y and Z occurred.
```

# Copyright

This work is in the public domain. In jurisdictions that do not allow for this, this work is available under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). To the extent possible under law, the person who associated [CC0](https://creativecommons.org/publicdomain/zero/1.0/) with this work has waived all copyright and related or neighboring rights to this work.
