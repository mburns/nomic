# Rules

[#101](rules/rule101.md): [meta init] 
> All players must always abide by all the rules then in effect, in the form in which they are then in effect. The rules in the Initial Set are in effect whenever a game begins.
> 
> The Initial Set consists of Rules 101-116 (immutable) and 201-213 (mutable).

[#102](rules/rule102.md): [meta init] 
> Initially rules in the `100`'s are immutable and rules in the `200`'s are mutable.
> 
> Rules subsequently enacted or transmuted (that is, changed from immutable to mutable or vice versa) may be immutable or mutable regardless of their numbers, and rules in the Initial Set may be transmuted regardless of their numbers.

[#103](rules/rule103.md): [change init] 
> A rule-change is any of the following:
> 
> 1. the enactment, repeal, or amendment of a mutable rule;
> 2. the enactment, repeal, or amendment of an amendment of a mutable rule; or
> 3. the transmutation of an immutable rule into a mutable rule or vice versa.
> 
> (Note: This definition implies that, at least initially, all new rules are mutable; immutable rules, as long as they are immutable, may not be amended or repealed; mutable rules, as long as they are mutable, may be amended or repealed; any rule of any status may be transmuted; no rule is absolutely immune to change.)

[#104](rules/rule104.md): [change vote] 
> All rule-changes proposed in the proper way shall be voted on.
> 
> They will be adopted if and only if they receive the required number of votes.

[#106](rules/rule106.md): [change] 
> All proposed rule-changes shall be written down before they are voted on.
> 
> If they are adopted, they shall guide play in the form in which they were voted on.

[#107](rules/rule107.md): [change vote] 
> No rule-change may take effect earlier than the moment of the completion of the vote that adopted it, even if its wording explicitly states otherwise.
> 
> No rule-change may have retroactive application.

[#108](rules/rule108.md): [change] 
> Each proposed rule-change shall be given a number for reference.
> 
> The numbers shall begin with `301`, and each rule-change proposed in the proper way shall receive the next successive integer, whether or not the proposal is adopted.
> 
> * If a rule is repealed and reenacted, it receives the number of the proposal to reenact it.
> * If a rule is amended or transmuted, it receives the number of the proposal to amend or transmute it.
> * If an amendment is amended or repealed, the entire rule of which it is a part receives the number of the proposal to amend or repeal the amendment.

[#109](rules/rule109.md): [change vote] 
> Rule-changes that transmute immutable rules into mutable rules may be adopted if and only if the vote is unanimous among the eligible voters.
> 
> Transmutation shall not be implied, but must be stated explicitly in a proposal to take effect.

[#110](rules/rule110.md): [meta] 
> In a conflict between a mutable and an immutable rule, the immutable rule takes precedence and the mutable rule shall be entirely void.
> 
> For the purposes of this rule a proposal to transmute an immutable rule does not "conflict" with that immutable rule.

[#111](rules/rule111.md): [change judge vote] 
> If a rule-change as proposed is unclear, ambiguous, paradoxical, or destructive of play, or if it arguably consists of two or more rule-changes compounded or is an amendment that makes no difference, or if it is otherwise of questionable value, then the other players may suggest amendments or argue against the proposal before the vote.
> 
> A reasonable time must be allowed for this debate. The proponent decides the final form in which the proposal is to be voted on and, unless the Judge has been asked to do so, also decides the time to end debate and vote.

[#112](rules/rule112.md): [endgame point] 
> The state of affairs that constitutes winning may not be altered from achieving `N` points to any other state of affairs.
> 
> The magnitude of `N` and the means of earning points may be changed, and rules that establish a winner when play cannot continue may be enacted and (while they are mutable) be amended or repealed.

[#113](rules/rule113.md): [endgame player] 
> A player always has the option to forfeit the game rather than continue to play or incur a game penalty.
> 
> No penalty worse than losing, in the judgment of the player to incur it, may be imposed.

[#114](rules/rule114.md): [change meta] 
> There must always be at least one mutable rule.
> 
> The adoption of rule-changes must never become completely impermissible.

[#115](rules/rule115.md): [change] 
> Rule-changes that affect rules needed to allow or apply rule-changes are as permissible as other rule-changes.
> 
> Even rule-changes that amend or repeal their own authority are permissible.
> 
> No rule-change or type of move is impermissible solely on account of the self-reference or self-application of a rule.

[#116](rules/rule116.md): [meta] 
> Whatever is not prohibited or regulated by a rule is permitted and unregulated, with the sole exception of changing the rules, which is permitted only when a rule or set of rules explicitly or implicitly permits it.

[#201](rules/rule201.md): [player] 
> Players may take their turn at any time, independent of other Players.

[#202](rules/rule202.md): [point] 
> One turn consists of two parts in this order:
> 
> 1. Proposing one rule-change and having it voted on, and
> 2. Subtracting `291` from the ordinal number of their proposal and multiply the result by the fraction of favorable votes it received, rounded to the nearest integer.
> 
>     (This yields a number between `0` and `10` for the first player, with the upper limit increasing by one each turn; more points are awarded for more popular proposals.)

[#204](rules/rule204.md): [point vote] 
> If and when rule-changes can be adopted without unanimity, the players who vote against winning proposals shall receive 10 points each.

[#205](rules/rule205.md): [change] 
> An adopted rule-change takes full effect at the moment of the completion of the vote that adopted it.

[#206](rules/rule206.md): [point] 
> When a proposed rule-change is defeated, the player who proposed it loses 10 points.

[#207](rules/rule207.md): [vote] 
> Each player always has exactly one vote.
> 
> Upon submission of a rule-change, the proposing Player automatically casts an immutable `+1` vote for their proposal.

[#208](rules/rule208.md): [endgame] 
> The winner is the first player to achieve `200` (positive) points.

[#209](rules/rule209.md): [meta] 
> At no time may there be more than `25` mutable rules.

[#210](rules/rule210.md): [meta] 
> This rule does not apply to games by mail or computer.

[#211](rules/rule211.md): [meta] 
> If two or more mutable rules conflict with one another, or if two or more immutable rules conflict with one another, then the rule with the lowest ordinal number takes precedence.
> 
> If at least one of the rules in conflict explicitly says of itself that it defers to another rule (or type of rule) or takes precedence over another rule (or type of rule), then such provisions shall supersede the numerical method for determining precedence.
> 
> If two or more rules claim to take precedence over one another or to defer to one another, then the numerical method again governs.

[#212](rules/rule212.md): [judge vote] 
> If players disagree about the legality of a move or the interpretation or application of a rule, then the player preceding the one moving is to be the Judge and decide the question. Disagreement for the purposes of this rule may be created by the insistence of any player. This process is called invoking Judgment.
> 
> When Judgment has been invoked, the next player may not begin his or her turn without the consent of a majority of the other players.
> 
> The Judge's Judgment may be overruled only by a unanimous vote of the other players taken before the next turn is begun. If a Judge's Judgment is overruled, then the player preceding the Judge in the playing order becomes the new Judge for the question, and so on, except that no player is to be Judge during his or her own turn or during the turn of a team-mate.
> 
> Unless a Judge is overruled, one Judge settles all questions arising from the game until the next turn is begun, including questions as to his or her own legitimacy and jurisdiction as Judge.
> 
> New Judges are not bound by the decisions of old Judges. New Judges may, however, settle only those questions on which the players currently disagree and that affect the completion of the turn in which Judgment was invoked. All decisions by Judges shall be in accordance with all the rules then in effect; but when the rules are silent, inconsistent, or unclear on the point at issue, then the Judge shall consider game-custom and the spirit of the game before applying other standards.

[#213](rules/rule213.md): [endgame] 
> If the rules are changed so that further play is impossible, or if the legality of a move cannot be determined with finality, or if by the Judge's best reasoning, not overruled, a move appears equally legal and illegal, then the first player unable to complete a turn is the winner.
> 
> **This rule takes precedence over every other rule determining the winner.**

[#301](rules/rule301.md): [endgame] 
> When the Rules state that a Player or Players win the game, those players win the game and are declared Champion(s); specifically they win the Round that ends with the indicated win.
> 
> The nomic itself does not end and the ruleset remains unchanged.

[#303](rules/rule303.md): [meta change] 
> All rule proposals and amendments must adhere to the commit format set
> forth below.
> 
> For proposals:
> 
> ```markdown
> propose(<rule number>): Short, imperative description of the new rule.
> 
> A longer description of the rule if it is needed. The short description
> should be limited to 72 characters or less.
> ```
> 
> Example:
> 
> ```markdown
> propose(303): Define commit message format.
> 
> This rule defines a standard format for commit messages used when
> proposing new rules or amending existing rules.
> ```
> 
> For amendments:
> 
> ```markdown
> amend(<rule number>): Short, imperative description of the rule change.
> 
> A longer description of the rule if it is needed. The short description
> should be limited to 72 characters or less.
> ```
> 
> Example:
> 
> ```markdown
> amend(303): Increase the maximum characters in first line of commit msg.
> 
> This increases the maximum length of the first line in a commit message
> to 80 characters up from 72 characters.
> ```
> 
> For judgments:
> 
> ```markdown
> CFJ(<judgment number>): Short, imperative description of the CFJ
> 
> A longer description of the claim or judgment if it is needed. The short description should be limited to 80 characters or less.
> ```
> 
> Example:
> 
> ```markdown
> CFJ(1): Player Foo violated Rule ###
> 
> I claim that Player Foo violated Rule ### when X, Y and Z occurred.
> ```

[#308](rules/rule308.md): [vote] 
> A rule-change is adopted if and only if the vote is at least two-thirds in the affirmative (`+1`) among eligible voters.
> 
> ```javascript
> let v = number of votes
> let a = number of affirmative votes
> 
> let p = a / v
> 
> if p >= (2/3), proposal is adopted
> ```

[#309](rules/rule309.md): [player vote] 
> Every player is an eligible voter.
> 
> Eligible voters may choose to participate in votes on rule-changes or abstain. If no action is taken, a voter is considered to have abstained and is neither for or against the proposal.
> 
> Quorum is half of all active registered players. Votes on rule-changes take effect if and only if quorum is reached.
> 
> ```javascript
> let n = number of active players
> let v = number of votes
> let q = Floor(n / 2) + 1
> 
> if v >= q, quorum is reached.
> ```

