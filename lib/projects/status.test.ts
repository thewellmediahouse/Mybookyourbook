import { test } from "node:test";
import assert from "node:assert/strict";
import { CUSTOMER_STATUS_LABEL, isCreateWizardStatus, projectStatusLabel } from "./status";

test("dashboard statuses use customer labels from the spec", () => {
  assert.equal(CUSTOMER_STATUS_LABEL.DRAFT, "Draft");
  assert.equal(CUSTOMER_STATUS_LABEL.AWAITING_APPROVAL, "Awaiting Approval");
  assert.equal(CUSTOMER_STATUS_LABEL.READY_TO_PRODUCE, "Ready to Produce");
  assert.equal(CUSTOMER_STATUS_LABEL.IN_PRODUCTION, "In Production");
  assert.equal(CUSTOMER_STATUS_LABEL.ENHANCING, "Enhancing");
  assert.equal(CUSTOMER_STATUS_LABEL.BRANDING, "Branding");
  assert.equal(CUSTOMER_STATUS_LABEL.FINALISING, "Finalising");
  assert.equal(CUSTOMER_STATUS_LABEL.READY, "Ready");
  assert.equal(CUSTOMER_STATUS_LABEL.FAILED, "Failed");
  assert.equal(CUSTOMER_STATUS_LABEL.ARCHIVED, "Archived");
  assert.equal(projectStatusLabel("READY"), "Ready");
  assert.equal(isCreateWizardStatus("DRAFT"), true);
  assert.equal(isCreateWizardStatus("READY_TO_PRODUCE"), true);
  assert.equal(isCreateWizardStatus("IN_PRODUCTION"), false);
});
