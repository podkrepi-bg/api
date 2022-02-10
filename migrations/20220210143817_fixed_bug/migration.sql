-- DropForeignKey
ALTER TABLE "benefactors" DROP CONSTRAINT "benefactors_person_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_person_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "coordinators" DROP CONSTRAINT "coordinators_person_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "info_requests" DROP CONSTRAINT "info_requests_person_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_donations" DROP CONSTRAINT "recurring_donations_person_id_fkey";

-- DropForeignKey
ALTER TABLE "supporters" DROP CONSTRAINT "supporters_person_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_approved_by_id_fkey";