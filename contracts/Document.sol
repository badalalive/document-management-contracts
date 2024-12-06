// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Document {
    address public owner; // Address of the contract owner

    struct AuditEntry {
        uint256 timestamp;
        string action;
        string performedBy;
    }

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
    mapping(string => AuditEntry[]) public auditEntries; // Mapping to store audit details by documentId
    mapping(string => bool) public documentHashCreatedStatus; // Mapping to track if a document hash is already used

    event DocumentCreated(string userId, string documentId, string documentHash);
    event UserCreated(string userId, string name, string email);
    event AuditEntryAdded(string documentId, string action, string performedBy, uint256 timestamp);
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

    /**
     * @dev Adds audit entries in bulk for multiple documents.
     * @param documentIds The array of document IDs to which the audit entries belong.
     * @param actions The array of action descriptions for the audit entries.
     * @notice The arrays `documentIds` and `actions` must have the same length.
     */
    function addAuditEntries(
        string[] memory documentIds,
        string[] memory userIds,
        string[] memory actions,
        uint256[] memory timestamps
    ) external onlyOwner {
        require(documentIds.length == actions.length, "Mismatched input array lengths.");

        for (uint256 i = 0; i < documentIds.length; i++) {
            require(bytes(documentIds[i]).length > 0, "Invalid document ID.");
            require(bytes(actions[i]).length > 0, "Invalid action description.");
            require(bytes(userIds[i]).length > 0, "Invalid action description.");

            AuditEntry memory newEntry = AuditEntry({
                timestamp: timestamps[i],
                action: actions[i],
                performedBy: userIds[i]
            });

            auditEntries[documentIds[i]].push(newEntry);

            emit AuditEntryAdded(documentIds[i], actions[i], userIds[i], block.timestamp);
        }
    }

    /**
     * @dev Retrieves the audit history for a specific document.
     * @param documentId The ID of the document.
     * @return An array of AuditEntry for the document.
     */
    function getAuditHistory(string memory documentId) external view returns (AuditEntry[] memory) {
        return auditEntries[documentId];
    }
}
