#!/bin/bash
set -e

REPO="QuiQuig/partner-account-sync"
PROJECT_ID="PVT_kwHOCfCR9s4BSzkJ"

# Field IDs
STATUS_FIELD="PVTSSF_lAHOCfCR9s4BSzkJzhAO4c8"
PRIORITY_FIELD="PVTSSF_lAHOCfCR9s4BSzkJzhAO7Aw"
PHASE_FIELD="PVTSSF_lAHOCfCR9s4BSzkJzhAT45o"
EST_START_FIELD="PVTF_lAHOCfCR9s4BSzkJzhAO6_Q"
EST_END_FIELD="PVTF_lAHOCfCR9s4BSzkJzhAO6_8"
ACT_START_FIELD="PVTF_lAHOCfCR9s4BSzkJzhAO7AA"
ACT_END_FIELD="PVTF_lAHOCfCR9s4BSzkJzhAO7AE"

# Status option IDs
TODO="f8f8308e"
IN_PROGRESS="c56ce44e"
BLOCKED="6bb692ad"
DONE="776bd3f7"

# Priority option IDs
P0="3d78d8eb"
P1="60831119"
P2="dfc7373b"
P3="4c3d3e24"

# Phase option IDs
PHASE1="1519af47"
PHASE2="58f13a51"
PHASE3="a27939d4"
PHASE4="af2c598f"

create_issue() {
  local title="$1" labels="$2" status="$3" priority="$4" phase="$5"
  local est_start="$6" est_end="$7" act_start="$8" act_end="$9" close="${10}"

  echo "Creating: $title"

  # Create issue
  local issue_url
  issue_url=$(gh issue create -R "$REPO" --title "$title" --label "$labels" --body "" 2>&1 | tail -1)
  local issue_num
  issue_num=$(echo "$issue_url" | grep -oP '\d+$')
  echo "  -> #$issue_num"

  # Get issue node ID
  local node_id
  node_id=$(gh api graphql -f query="
    query {
      repository(owner: \"QuiQuig\", name: \"partner-account-sync\") {
        issue(number: $issue_num) { id }
      }
    }" --jq '.data.repository.issue.id')

  # Add to project
  local item_id
  item_id=$(gh api graphql -f query="
    mutation {
      addProjectV2ItemById(input: {
        projectId: \"$PROJECT_ID\"
        contentId: \"$node_id\"
      }) {
        item { id }
      }
    }" --jq '.data.addProjectV2ItemById.item.id')

  echo "  -> project item $item_id"

  # Set Status
  if [ -n "$status" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$STATUS_FIELD\"
          value: { singleSelectOptionId: \"$status\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Set Priority
  if [ -n "$priority" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$PRIORITY_FIELD\"
          value: { singleSelectOptionId: \"$priority\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Set Phase
  if [ -n "$phase" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$PHASE_FIELD\"
          value: { singleSelectOptionId: \"$phase\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Set Estimated Start
  if [ -n "$est_start" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$EST_START_FIELD\"
          value: { date: \"$est_start\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Set Estimated End
  if [ -n "$est_end" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$EST_END_FIELD\"
          value: { date: \"$est_end\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Set Actual Start
  if [ -n "$act_start" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$ACT_START_FIELD\"
          value: { date: \"$act_start\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Set Actual End
  if [ -n "$act_end" ]; then
    gh api graphql -f query="
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$ACT_END_FIELD\"
          value: { date: \"$act_end\" }
        }) { clientMutationId }
      }" > /dev/null
  fi

  # Close if done
  if [ "$close" = "yes" ]; then
    gh issue close "$issue_num" -R "$REPO" > /dev/null 2>&1
  fi

  echo "  -> fields set"
}

# Ensure labels exist
gh label create setup --color 0E8A16 -R "$REPO" 2>/dev/null || true
gh label create feature --color 1D76DB -R "$REPO" 2>/dev/null || true
gh label create testing --color BFD4F2 -R "$REPO" 2>/dev/null || true
gh label create api --color D93F0B -R "$REPO" 2>/dev/null || true
gh label create core --color 5319E7 -R "$REPO" 2>/dev/null || true
gh label create reporting --color FBCA04 -R "$REPO" 2>/dev/null || true
gh label create docs --color 0075CA -R "$REPO" 2>/dev/null || true

echo "=== Creating 24 issues ==="
echo ""

# Phase 1 — Core Infrastructure (all Done)
#                              title                                                            labels     status priority phase   est_start    est_end      act_start    act_end      close
create_issue "Project scaffolding — TypeScript, ESM, package.json, tsconfig"                    "setup"    $DONE  $P1      $PHASE1 "2026-01-06" "2026-01-07" "2026-01-06" "2026-01-07" "yes"
create_issue "Environment config with Zod validation and .env loading"                          "setup"    $DONE  $P1      $PHASE1 "2026-01-08" "2026-01-09" "2026-01-08" "2026-01-09" "yes"
create_issue "Structured logging with Pino + pretty-print for CLI"                              "setup"    $DONE  $P2      $PHASE1 "2026-01-10" "2026-01-10" "2026-01-10" "2026-01-10" "yes"
create_issue "CLI entry point with arg parsing (--dry-run, --start-date, --end-date)"           "feature"  $DONE  $P1      $PHASE1 "2026-01-11" "2026-01-13" "2026-01-11" "2026-01-14" "yes"
create_issue "Utility modules — string normalization, name parser, address normalizer"          "feature"  $DONE  $P2      $PHASE1 "2026-01-14" "2026-01-16" "2026-01-14" "2026-01-17" "yes"
create_issue "Unit tests for all utility modules (Vitest)"                                      "testing"  $DONE  $P2      $PHASE1 "2026-01-17" "2026-01-20" "2026-01-17" "2026-01-21" "yes"

# Phase 2 — API Integration (all Done)
create_issue "QuickBase REST client — token auth, query, runReport, pagination"                 "feature,api" $DONE $P1    $PHASE2 "2026-01-21" "2026-01-23" "2026-01-21" "2026-01-24" "yes"
create_issue "QuickBase record flattener — nested field structure to key-value"                  "feature"  $DONE  $P2      $PHASE2 "2026-01-24" "2026-01-27" "2026-01-24" "2026-01-27" "yes"
create_issue "Salesforce JWT Bearer auth flow (RS256 private key signing)"                      "feature,api" $DONE $P0    $PHASE2 "2026-01-27" "2026-01-30" "2026-01-27" "2026-02-04" "yes"
create_issue "Salesforce SOQL query client with pagination and CRUD operations"                 "feature,api" $DONE $P1    $PHASE2 "2026-01-31" "2026-02-04" "2026-02-04" "2026-02-07" "yes"
create_issue "Salesforce batch composite API — bulk create (200 records/request)"               "feature,api" $DONE $P1    $PHASE2 "2026-02-05" "2026-02-07" "2026-02-07" "2026-02-11" "yes"
create_issue "Shared API types — SFAccount, SFContact, SFLicense, QBRecord interfaces"         "feature"  $DONE  $P2      $PHASE2 "2026-02-10" "2026-02-11" "2026-02-11" "2026-02-12" "yes"

# Phase 3 — Sync Engine (mixed)
create_issue "Account matcher — in-memory indexes, 9-tier match priority, fuzzy scoring"        "feature,core" $DONE $P0  $PHASE3 "2026-02-12" "2026-02-19" "2026-02-12" "2026-02-25" "yes"
create_issue "Sync orchestrator — multi-phase execution, dedup, batch deferral"                 "feature,core" $DONE $P1  $PHASE3 "2026-02-20" "2026-03-03" "2026-02-20" "2026-03-07" "yes"
create_issue "Asset mapper — product type mapping, license status, BDOM extraction"             "feature"  $DONE  $P2      $PHASE3 "2026-03-04" "2026-03-06" "2026-03-07" "2026-03-11" "yes"
create_issue "Sync logger — outcome collection, typed arrays, error aggregation"                "feature"  $DONE  $P2      $PHASE3 "2026-03-07" "2026-03-11" "2026-03-11" "2026-03-14" "yes"
create_issue "Partner sync flow — enrich from QB, match/create SF accounts + contacts"          "feature,core" $IN_PROGRESS $P1 $PHASE3 "2026-03-12" "2026-03-18" "2026-03-14" "" ""
create_issue "Customer sync flow — 4-source QB enrichment, match/create SF accounts"            "feature,core" $IN_PROGRESS $P1 $PHASE3 "2026-03-19" "2026-03-25" "2026-03-20" "" ""
create_issue "Asset sync flow — find QB assets, batch-create SF Asset records"                  "feature"  $BLOCKED $P1    $PHASE3 "2026-03-26" "2026-03-31" "" "" ""

# Phase 4 — Reporting & Polish (mostly todo)
create_issue "Excel report generator — 10-sheet workbook with SF Lightning hyperlinks"          "feature,reporting" $IN_PROGRESS $P2 $PHASE4 "2026-03-19" "2026-03-26" "2026-03-21" "" ""
create_issue "API error parser — translate SF/QB errors to plain English"                       "feature"  $DONE  $P3      $PHASE4 "2026-03-14" "2026-03-17" "2026-03-14" "2026-03-18" "yes"
create_issue "Dry-run mode — full execution without SF writes"                                  "feature"  $TODO  $P3      $PHASE4 "2026-03-27" "2026-03-28" "" "" ""
create_issue "End-to-end sandbox testing with production-like data"                             "testing"  $TODO  $P3      $PHASE4 "2026-03-29" "2026-04-02" "" "" ""
create_issue "Documentation — README, .env.example, setup instructions"                        "docs"     $TODO  $P3      $PHASE4 "2026-04-03" "2026-04-04" "" "" ""

echo ""
echo "=== Done! 24 issues created and configured ==="
