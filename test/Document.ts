import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Document Contract", function () {
    async function deployDocumentFixture() {
        const Document = await hre.ethers.getContractFactory("Document");
        const [owner, otherAccount] = await hre.ethers.getSigners();

        const document = await Document.deploy();
        return { document, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            const { document, owner } = await loadFixture(deployDocumentFixture);
            expect(await document.owner()).to.equal(owner.address);
        });
    });

    describe("User Management", function () {
        describe("createUser", function () {
            it("Should allow only owner to create a user", async function () {
                const { document, owner, otherAccount } = await loadFixture(deployDocumentFixture);

                const userId = "user122423";
                const name = "block master";
                const email = "blockmaster@chain.com";

                await expect(document.connect(owner).createUser(userId, name, email))
                    .to.emit(document, "UserCreated")
                    .withArgs(userId, name, email);

                const userDetails = await document.users(userId);
                expect(userDetails.name).to.equal(name);
                expect(userDetails.email).to.equal(email);

                await expect(
                    document.connect(otherAccount).createUser("user122424", "Jane Doe", "jane.doe@example.com")
                ).to.be.revertedWith("Only the contract owner can perform this action.");
            });

            it("Should not allow creating a user with an existing userId", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const userId = "user122423";
                const name = "block master";
                const email = "blockmaster@chain.com";

                await document.connect(owner).createUser(userId, name, email);

                await expect(document.connect(owner).createUser(userId, name, email)).to.be.revertedWith(
                    "User already exists."
                );
            });
        });
    });

    describe("Document Management", function () {
        describe("createDocument", function () {
            it("Should allow owner to create a document", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const userId = "user122423";
                const name = "block master";
                const email = "blockmaster@chain.com";
                const documentId = "doc1235142";
                const documentHash = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";

                await document.connect(owner).createUser(userId, name, email);

                await expect(document.connect(owner).createDocument(userId, documentHash, documentId))
                    .to.emit(document, "DocumentCreated")
                    .withArgs(userId, documentId, documentHash);

                const userDocuments = await document.getDocumentsByUser(userId);
                expect(userDocuments.length).to.equal(1);
                expect(userDocuments[0].id).to.equal(documentId);
                expect(userDocuments[0].hash).to.equal(documentHash);
            });

            it("Should not allow creating a document for a non-existent user", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const userId = "user64646";
                const documentId = "doc1235142";
                const documentHash = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";

                await expect(
                    document.connect(owner).createDocument(userId, documentHash, documentId)
                ).to.be.revertedWith("User does not exist.");
            });

            it("Should not allow creating a document with a duplicate hash", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const userId = "user122423";
                const name = "block master";
                const email = "blockmaster@chain.com";
                const documentId = "doc1235142";
                const documentHash = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";

                await document.connect(owner).createUser(userId, name, email);
                await document.connect(owner).createDocument(userId, documentHash, documentId);

                await expect(
                    document.connect(owner).createDocument(userId, documentHash, "doc2")
                ).to.be.revertedWith("Document hash already exists.");
            });
        });

        describe("getDocumentsByUser", function () {
            it("Should return documents for a valid user", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const userId = "user122423";
                const name = "block master";
                const email = "blockmaster@chain.com";

                await document.connect(owner).createUser(userId, name, email);

                const documentId1 = "doc1235142";
                const documentHash1 = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";
                await document.connect(owner).createDocument(userId, documentHash1, documentId1);

                const documentId2 = "doc1235145";
                const documentHash2 = "ab95c37027cc6f462e4de8c667a9dc552a150f83971605d4f1cf0c445ab16317";

                await document.connect(owner).createDocument(userId, documentHash2, documentId2);

                const userDocuments = await document.getDocumentsByUser(userId);
                expect(userDocuments.length).to.equal(2);
                expect(userDocuments[0].id).to.equal(documentId1);
                expect(userDocuments[1].id).to.equal(documentId2);
            });

            it("Should revert for a non-existent user", async function () {
                const { document } = await loadFixture(deployDocumentFixture);

                await expect(document.getDocumentsByUser("nonExistentUser")).to.be.revertedWith(
                    "User does not exist."
                );
            });
        });
    });

    describe("AuditEntry Management", function () {
        describe("addAuditEntries", function () {
            it("Should add audit entries for valid inputs", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const documentIds = ["doc1235142", "doc1235145"];
                const userIds = ["user122423", "user122423"];
                const actions = ["Modified", "Modified"];
                const timestamps = [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)];

                await document.connect(owner).addAuditEntries(documentIds, userIds, actions, timestamps);

                const auditHistory1 = await document.getAuditHistory(documentIds[0]);
                const auditHistory2 = await document.getAuditHistory(documentIds[1]);

                expect(auditHistory1.length).to.equal(1);
                expect(auditHistory1[0].action).to.equal(actions[0]);
                expect(auditHistory1[0].performedBy).to.equal(userIds[0]);
                expect(auditHistory1[0].timestamp).to.equal(timestamps[0]);

                expect(auditHistory2.length).to.equal(1);
                expect(auditHistory2[0].action).to.equal(actions[1]);
                expect(auditHistory2[0].performedBy).to.equal(userIds[1]);
                expect(auditHistory2[0].timestamp).to.equal(timestamps[1]);
            });

            it("Should revert if array lengths are mismatched", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const documentIds = ["doc1235142"];
                const userIds = ["user123"];
                const actions = ["Document Signed", "Document Viewed"];
                const timestamps = [Math.floor(Date.now() / 1000)];

                await expect(
                    document.connect(owner).addAuditEntries(documentIds, userIds, actions, timestamps)
                ).to.be.revertedWith("Mismatched input array lengths.");
            });

            it("Should revert if any document ID is invalid", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const documentIds = ["", "doc1235145"];
                const userIds = ["user123", "user456"];
                const actions = ["Document Signed", "Document Viewed"];
                const timestamps = [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)];

                await expect(
                    document.connect(owner).addAuditEntries(documentIds, userIds, actions, timestamps)
                ).to.be.revertedWith("Invalid document ID.");
            });

            it("Should revert if any action description is invalid", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const documentIds = ["doc1235142", "doc1235145"];
                const userIds = ["user123", "user456"];
                const actions = ["Document Signed", ""];
                const timestamps = [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)];

                await expect(
                    document.connect(owner).addAuditEntries(documentIds, userIds, actions, timestamps)
                ).to.be.revertedWith("Invalid action description.");
            });
        });

        describe("getAuditHistory", function () {
            it("Should return the correct audit history for a document", async function () {
                const { document, owner } = await loadFixture(deployDocumentFixture);

                const documentId = "doc1235142";
                const userIds = ["user123", "user123"];
                const actions = ["Document Signed", "Document Updated"];
                const timestamps = [Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)];

                await document.connect(owner).addAuditEntries(
                    [documentId, documentId],
                    userIds,
                    actions,
                    timestamps
                );

                const auditHistory = await document.getAuditHistory(documentId);
                expect(auditHistory.length).to.equal(2);

                expect(auditHistory[0].action).to.equal(actions[0]);
                expect(auditHistory[0].performedBy).to.equal(userIds[0]);
                expect(auditHistory[0].timestamp).to.equal(timestamps[0]);

                expect(auditHistory[1].action).to.equal(actions[1]);
                expect(auditHistory[1].performedBy).to.equal(userIds[1]);
                expect(auditHistory[1].timestamp).to.equal(timestamps[1]);
            });

            it("Should return an empty array for a document with no audit history", async function () {
                const { document } = await loadFixture(deployDocumentFixture);

                const auditHistory = await document.getAuditHistory("nonExistentDocument");
                expect(auditHistory.length).to.equal(0);
            });
        });
    });

    describe("ShareDocument", function () {
        it("Should allow the document owner to share a document with another user", async function () {
            const { document, owner, otherAccount } = await loadFixture(deployDocumentFixture);

            const userId = "user122423";
            const sharedWithUserId = "user345678";
            const name = "block master";
            const email = "blockmaster@chain.com";
            const documentId = "doc1235142";
            const documentHash = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";

            // Create two users
            await document.connect(owner).createUser(userId, name, email);
            await document.connect(owner).createUser(sharedWithUserId, "Shared User", "shared@chain.com");
            // Create a document for the original user
            await document.connect(owner).createDocument(userId, documentHash, documentId);

            // Share the document with another user
            await expect(document.connect(owner).shareDocument(userId, sharedWithUserId, documentId))
                .to.emit(document, "DocumentShared")
                .withArgs(documentId, userId, sharedWithUserId);
        });

        it("Should revert if the document does not belong to the user", async function () {
            const { document, owner, otherAccount } = await loadFixture(deployDocumentFixture);

            const userId = "user122423";
            const sharedWithUserId = "user345678";
            const documentId = "doc1235142";
            const documentHash = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";

            // Create two users
            await document.connect(owner).createUser(userId, "Owner User", "owner@chain.com");
            await document.connect(owner).createUser(sharedWithUserId, "Shared User", "shared@chain.com");

            // Create a document for the original user
            await document.connect(owner).createDocument(userId, documentHash, documentId);

            // Attempt to share a document not owned by the user
            await expect(
                document.connect(owner).shareDocument(userId, sharedWithUserId, "doc1235167")
            ).to.be.revertedWith("Document does not exist.");
        });

        it("Should revert if trying to share with a non-existent user", async function () {
            const { document, owner } = await loadFixture(deployDocumentFixture);

            const userId = "user122423";
            const documentId = "doc1235142";
            const documentHash = "eb95c37027cc6f462e4de8c355a9dc552a150f83971605d4f1cf0c445ab16317";

            // Create a user and a document
            await document.connect(owner).createUser(userId, "Owner User", "owner@chain.com");
            await document.connect(owner).createDocument(userId, documentHash, documentId);

            // Attempt to share the document with a non-existent user
            await expect(
                document.connect(owner).shareDocument(userId, "nonExistentUser", documentId)
            ).to.be.revertedWith("Shared user does not exist.");
        });

        it("Should revert if the document does not exist", async function () {
            const { document, owner } = await loadFixture(deployDocumentFixture);

            const userId = "user122423";
            const sharedWithUserId = "user345678";

            // Create two users
            await document.connect(owner).createUser(userId, "Owner User", "owner@chain.com");
            await document.connect(owner).createUser(sharedWithUserId, "Shared User", "shared@chain.com");

            // Attempt to share a non-existent document
            await expect(
                document.connect(owner).shareDocument(userId, sharedWithUserId, "nonExistentDocument")
            ).to.be.revertedWith("Document does not exist.");
        });
    });

});
