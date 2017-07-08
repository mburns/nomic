package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/pborman/getopt/v2"
)

// This helper will streamline our error checks below.
func check(e error) {
	if e != nil {
		panic(e)
	}
}

// Metadata of a Rule
type Metadata struct {
	Number int
	Author string
	Status string
	Type   string
	Tags   []string
}

// Body is the actual text of the rule
type Body struct {
	Text       string
	Examples   string
	Original   string
	References string
}

// Rule components of a given rule in Nomic
type Rule struct {
	Metadata  *Metadata
	Body      *Body
	Copyright string
}

// Split on : char and get first value
func getMetaKey(line []byte) string {
	k := bytes.Split(line, []byte(": "))[0]

	// Cast byte[] to string
	return fmt.Sprintf("%s", k)
}

// Split on : char and get second value
func getMetaVal(line []byte) string {
	k := bytes.Split(line, []byte(": "))[1]

	// Cast byte[] to string
	return fmt.Sprintf("%s", k)
}

// Check whether a rule is mutable or not
func isMutable(rule Rule) bool {
	if rule.Metadata.Type == "Mutable" {
		return true
	}

	return false
}

// Count the number of mutable rules
func countMutable(rules []Rule) int {
	var count int

	for _, v := range rules {
		if isMutable(v) {
			count++
		}
	}
	return count
}

// Create a new Rule struct
func newRule(metadata *Metadata, body *Body, copyright string) *Rule {
	rule := &Rule{
		Metadata:  metadata,
		Body:      body,
		Copyright: copyright,
	}
	return rule
}

// Read a single markdown file, parse as a Rule
func readRule(filename string, dir string) *Rule {
	path := dir + filename
	file, err := os.Open(path)
	check(err)

	defer file.Close()

	reader := bufio.NewReader(file)

	// constituent parts of a rule
	metadata := &Metadata{}
	body := &Body{}
	var copyright string

	// read lind-by-line until second `--`
	count := 0
	for {
		line, _, err := reader.ReadLine()

		if err == io.EOF {
			break
		}

		if bytes.Contains(line, []byte("---")) {
			count++

			if count > 1 {
				break
			}
		}

		if bytes.Contains(line, []byte("RULE")) {
			if s, err := strconv.Atoi(getMetaVal(line)); err == nil {
				metadata.Number = s
			}
			check(err)
		}

		if bytes.Contains(line, []byte("Author")) {
			metadata.Author = getMetaVal(line)
		}

		if bytes.Contains(line, []byte("Status")) {
			metadata.Status = getMetaVal(line)
		}

		if bytes.Contains(line, []byte("Tags")) {
			t := getMetaVal(line)
			metadata.Tags = strings.Split(t, ", ")
		}

		if bytes.Contains(line, []byte("Type")) {
			metadata.Type = getMetaVal(line)
		}
	}

	step := "Text"
	for {
		line, _, err := reader.ReadLine()

		if err == io.EOF {
			break
		}

		// convert line from byte array to string
		str := fmt.Sprintf("%s\n", line)

		// eat blank lines
		// rn := regexp.MustCompile("^$")
		// check(err)
		// n := rn.FindStringSubmatch(str)
		// if len(n) > 0 {
		// 	continue
		// }

		// grab (sub)heading name
		r := regexp.MustCompile("^#+ ([A-Za-z]+)")
		check(err)

		m := r.FindStringSubmatch(str)

		if len(m) > 0 {
			step = m[1]
			// Body.Text is the catch-all for any text not part of another heading
			if step == "Rule" {
				step = "Text"
				continue
			}
		}
		// step = (sub)heading

		// append line to correct string
		switch step {
		case "Text":
			// TODO : remove hack by prepending 4 spaces directly to the Rule text
			body.Text = body.Text + "> " + str
		case "Example":
			body.Examples = body.Examples + str
		case "Original":
			body.Original = body.Original + str
		case "References":
			body.References = body.References + str
		case "Copyright":
			copyright = copyright + str
		default:
			body.Examples = body.Examples + str

			// panic("unrecognized escape character")
		}
	}

	rule := newRule(metadata, body, copyright)

	return rule
}

// gather summary of all rule text
func getRules(dir string) []Rule {
	files, err := ioutil.ReadDir(dir)
	check(err)

	ruleset := []Rule{}

	for _, file := range files {
		// improve the filename check. /^rule[0-9]*\.md$/
		if strings.HasPrefix(file.Name(), "rule") {
			// fmt.Println(file.Name())
			r := readRule(file.Name(), dir)
			ruleset = append(ruleset, *r)
		}
	}
	return ruleset
}

// write out all rule text to single RULES.md file
func writeRules(rules []Rule) {
	var dat string

	// TODO :  concat all rule.Body.Text
	dat = "# Rules\n\n"

	for _, v := range rules {
		dat = dat + fmt.Sprintf("[#%d](rules/rule%d.md): %s \n%s\n", v.Metadata.Number, v.Metadata.Number, v.Metadata.Tags, v.Body.Text)
	}
	err := ioutil.WriteFile("RULES.md", []byte(dat), 0644)
	check(err)
}

// determine a list of valid users
func getUsers() {
}

func printTags(rules []Rule) {

	for _, v := range rules {
		fmt.Println(v.Metadata.Number, v.Metadata.Tags)
	}

}

func printRule(rule Rule) {
	fmt.Printf("%d\n", rule.Metadata.Number)
	// fmt.Printf("%d, %s\n", rule.Metadata.Number, rule.Body.Text)
}

func hasTag(tag string, list []string) bool {
	for _, b := range list {
		if b == tag {
			return true
		}
	}
	return false
}

func getTag(rules []Rule, tag string) {

	for _, v := range rules {
		if hasTag(tag, v.Metadata.Tags) {
			printRule(v)
		}
	}

}

// read CHANGELOG, generate user scores
func getScores() {
	// getUsers
	// read CHANGELOG
}

// iterate over users,scores and output SCOREBOARD.md
func writeScoreboard() {
	var dat string

	// getScores()

	dat = `# Scoreboard

	User | Points
	---- | ------
	`

	// TODO : list users & scores

	err := ioutil.WriteFile("SCOREBOARD.md", []byte(dat), 0644)
	check(err)
}

var verbose = false
var dir = "rules/"
var tag string

func init() {
	getopt.Flag(&verbose, 'v', "be verbose")
	getopt.FlagLong(&dir, "directory", 'd', "The directory where rules are stored.")
	getopt.FlagLong(&tag, "tag", 't', "Tag to search for.")
}

func main() {

	getopt.Parse()

	rules := getRules(dir)
	writeRules(rules)

	if tag != "" {
		getTag(rules, tag)
	}

	if verbose {
		printTags(rules)
	}

	m := countMutable(rules)
	if m < 25 {
		fmt.Printf("There are %d mutable rules\n", m)

	} else {
		panic("There are too many immutable rules")
	}
}
