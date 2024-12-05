// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Document {
    address public owner; // Address of the contract owner

    struct DocumentDetails {
        string id;
        string hash;
    }

    struct UserDetails {
        string name;
        string email;
        DocumentDetails[] documents;
    }

    mapping(string => UserDetails) public users; // Mapping to store user details by userId
    mapping(string => bool) public documentHashCreatedStatus; // Mapping to track if a document hash is already used

    event DocumentCreated(string userId, string documentId, string documentHash);
    event UserCreated(string userId, string name, string email);
    constructor() {
        owner = msg.sender; // Set the contract deployer as the owner
    }

    /**
     * @dev Modifier to restrict access to only the contract owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can perform this action.");
        _;
    }

    /**
     * @dev Modifier to validate if a document hash is unique and hasn't been used before.
     * @param documentHash The hash of the document to validate.
     */
    modifier validateDocumentHash(string memory documentHash) {
        require(!documentHashCreatedStatus[documentHash], "Document hash already exists.");
        _;
    }

    /**
     * @dev Creates a new user in the system.
     * @param userId The unique identifier for the user.
     * @param name The name of the user.
     * @param email The email of the user.
     * @notice Only the owner can call this function.
     */
    function createUser(
        string memory userId,
        string memory name,
        string memory email
    ) external onlyOwner {
        require(bytes(users[userId].name).length == 0, "User already exists."); // Check if the userId already exists
        users[userId].name = name; // Set the user's name
        users[userId].email = email; // Set the user's email
        emit UserCreated(userId, name, email);
    }

    /**
     * @dev Creates a new document for a specific user.
     * @param userId The unique identifier for the user.
     * @param documentHash The unique hash of the document.
     * @notice Requires the document hash to be unique and the user to exist.
     */
    function createDocument(
        string memory userId,
        string memory documentHash,
        string memory documentId
    ) external onlyOwner validateDocumentHash(documentHash) {
        require(bytes(users[userId].name).length > 0, "User does not exist."); // Ensure the user exists

        // Create a new document and add it to the user's documents array
        DocumentDetails memory newDocument = DocumentDetails({
            id: documentId,
            hash: documentHash
        });
        users[userId].documents.push(newDocument);

        // Mark the document hash as used
        documentHashCreatedStatus[documentHash] = true;

        emit DocumentCreated(userId, documentId, documentHash);
    }

    /**
     * @dev Retrieves all documents associated with a specific user.
     * @param userId The unique identifier for the user.
     * @return An array of DocumentDetails for the user.
     */
    function getDocumentsByUser(string memory userId) external view returns (DocumentDetails[] memory) {
        require(bytes(users[userId].name).length > 0, "User does not exist."); // Ensure the user exists
        return users[userId].documents; // Return the user's documents
    }

    /**
     * @dev Retrieves details of a specific user, including their documents.
     * @param userId The unique identifier for the user.
     * @return name The name of the user.
     * @return email The email of the user.
     * @return docs The array of documents associated with the user.
     */
    function getUserDetails(string memory userId)
    external
    view
    returns (string memory name, string memory email, DocumentDetails[] memory docs)
    {
        require(bytes(users[userId].name).length > 0, "User does not exist."); // Ensure the user exists
        UserDetails storage user = users[userId];
        return (user.name, user.email, user.documents); // Return user details
    }
}
