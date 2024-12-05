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
});
