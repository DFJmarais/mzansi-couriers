# POPIA Compliance: Courier Bank Account Details

## Introduction

This document outlines the storage and handling of courier bank account details within the Mzansi Couriers platform, with specific consideration for compliance with the South African Protection of Personal Information Act (POPIA).

## Data Stored

Courier bank account details are stored in the `paymentMethods` table within the database. The following fields are collected and stored:

| Field Name      | Data Type | Description                               |
| :-------------- | :-------- | :---------------------------------------- |
| `accountName`   | `varchar` | The name of the bank account holder.      |
| `accountNumber` | `varchar` | The bank account number.                  |
| `bankName`      | `varchar` | The name of the bank.                     |
| `userId`        | `int`     | Foreign key linking to the `users` table. |
| `type`          | `enum`    | Type of payment method (e.g., EFT, Capitec, Card, Wallet). |
| `isDefault`     | `boolean` | Indicates if this is the default payment method. |
| `isActive`      | `boolean` | Indicates if the payment method is active. |
| `createdAt`     | `timestamp` | Timestamp of record creation.             |
| `updatedAt`     | `timestamp` | Timestamp of last update.                 |

## Purpose of Collection

Bank account details are collected solely for the purpose of facilitating timely and accurate payments to couriers for services rendered on the Mzansi Couriers platform. This is essential for the operational functionality of the platform and the contractual relationship between Mzansi Couriers and its couriers.

## POPIA Compliance Considerations

Under the POPIA Act, the processing of personal information, especially sensitive financial information, requires adherence to several key principles [1]:

1.  **Accountability:** Mzansi Couriers, as the responsible party, must ensure compliance with POPIA.
2.  **Processing Limitation:** Personal information must be processed lawfully, in a reasonable manner, and not infringe on the privacy of the data subject. Collection must be for a specific, explicitly defined, and lawful purpose related to the functions or activities of Mzansi Couriers.
3.  **Purpose Specification:** The purpose for collecting bank details is clearly defined as courier payment.
4.  **Further Processing Limitation:** Information should not be processed further in a way that is incompatible with the initial purpose.
5.  **Information Quality:** Reasonable steps must be taken to ensure the information is complete, accurate, not misleading, and updated where necessary.
6.  **Openness:** Data subjects must be aware that their information is being collected and for what purpose. This will be addressed by adding a privacy consent notice during onboarding.
7.  **Security Safeguards:** Personal information must be protected against loss, damage, unauthorized destruction, and unlawful access or processing. This includes technical and organizational measures.
8.  **Data Subject Participation:** Data subjects have the right to access and request correction or deletion of their personal information.

## Current Security Measures (Assumed)

While specific implementation details are not visible in the schema, it is assumed that the platform employs standard security practices for sensitive data, including:

-   **Encryption at Rest:** Bank account numbers should be encrypted when stored in the database.
-   **Encryption in Transit:** Data transfer (e.g., during API calls to payment processors) should use secure protocols (HTTPS/SSL/TLS).
-   **Access Control:** Strict role-based access control (RBAC) should limit who can view or modify bank details.
-   **Data Minimization:** Only necessary information is collected.
-   **Regular Security Audits:** To identify and mitigate vulnerabilities.

## Recommendations for Enhanced POPIA Compliance

To further strengthen POPIA compliance, the following are recommended:

1.  **Explicit Consent:** Implement a clear, unambiguous consent mechanism during the courier onboarding process specifically for the collection and processing of bank account details for payment purposes. This will be addressed in the next phase.
2.  **Privacy Policy:** Ensure a comprehensive and easily accessible privacy policy is available, detailing how personal information, including bank details, is collected, stored, processed, and shared (e.g., with payment processors).
3.  **Data Retention Policy:** Define and implement a clear policy for how long bank account details are retained after a courier ceases to operate on the platform.
4.  **Data Breach Protocol:** Establish and regularly test a protocol for responding to and notifying affected parties and the Information Regulator in the event of a data breach.
5.  **Third-Party Agreements:** Ensure that any third-party payment processors (e.g., Paystack) are also POPIA compliant and have appropriate data processing agreements in place.

## Conclusion

The current database schema provides a structured approach to storing bank account details. By implementing explicit consent mechanisms and ensuring robust security and privacy policies, Mzansi Couriers can maintain strong POPIA compliance for this sensitive information.

## References

[1] Protection of Personal Information Act (POPIA) - South Africa. (2013). *Government Gazette, Vol. 581, No. 37067*.
