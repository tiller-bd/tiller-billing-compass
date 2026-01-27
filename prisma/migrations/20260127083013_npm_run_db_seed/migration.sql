-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(150),
    "contact_email" VARCHAR(150),
    "contact_phone" VARCHAR(50),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "project_name" VARCHAR(200) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "total_project_value" DECIMAL(15,2),
    "pg_percent" DECIMAL(5,2),
    "pg_amount" DECIMAL(15,2),
    "pg_bank_share_percent" DECIMAL(5,2),
    "pg_user_deposit" DECIMAL(15,2),
    "pg_status" VARCHAR(20) DEFAULT 'PENDING',
    "pg_clearance_date" DATE,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_bills" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "sl_no" VARCHAR(20),
    "bill_name" VARCHAR(200),
    "bill_percent" DECIMAL(5,2),
    "bill_amount" DECIMAL(15,2) NOT NULL,
    "tentative_billing_date" DATE,
    "received_percent" DECIMAL(5,2),
    "received_amount" DECIMAL(15,2) DEFAULT 0,
    "received_date" DATE,
    "remaining_amount" DECIMAL(15,2),
    "vat" DECIMAL(15,2),
    "it" DECIMAL(15,2),
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_name_key" ON "project_categories"("name");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_bills" ADD CONSTRAINT "project_bills_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
