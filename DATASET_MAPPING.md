# Description of the German Credit Dataset

## 1. Title  
**German Credit Data**

## 2. Source Information  
**Professor Dr. Hans Hofmann**  
Institut für Statistik und Ökonometrie  
Universität Hamburg  
FB Wirtschaftswissenschaften  
Von-Melle-Park 5  
2000 Hamburg 13  

## 3. Number of Instances  
**1000**

Two datasets are provided.  
The original dataset, in the form provided by Prof. Hofmann, contains **categorical/symbolic attributes** and is stored in the file `german.data`.  

For algorithms requiring numerical attributes, Strathclyde University produced `german.data-numeric`.  
This version was edited and includes several **indicator variables**, making it suitable for algorithms that cannot handle categorical variables directly.  
Several ordered categorical attributes (such as attribute 17) were coded as integers.  
This was the form used by **StatLog**.

---

## 6. Number of Attributes  
- **german.data**: 20 attributes (7 numerical, 13 categorical)  
- **german.data-numeric**: 24 numerical attributes  

---

## 7. Attribute Description (german.data)

### Attribute 1: Status of existing checking account (qualitative)
- A11: … < 0 DM  
- A12: 0 ≤ … < 200 DM  
- A13: ≥ 200 DM / salary assignments for ≥ 1 year  
- A14: no checking account  

### Attribute 2: Duration (numerical)  
- Duration in months  

### Attribute 3: Credit history (qualitative)
- A30: no credits taken / all credits paid back duly  
- A31: all credits at this bank paid back duly  
- A32: existing credits paid back duly till now  
- A33: delay in paying off in the past  
- A34: critical account / other credits existing (not at this bank)  

### Attribute 4: Purpose (qualitative)
- A40: car (new)  
- A41: car (used)  
- A42: furniture/equipment  
- A43: radio/television  
- A44: domestic appliances  
- A45: repairs  
- A46: education  
- A47: (vacation – does not exist?)  
- A48: retraining  
- A49: business  
- A410: others  

### Attribute 5: Credit amount (numerical)

### Attribute 6: Savings account/bonds (qualitative)
- A61: … < 100 DM  
- A62: 100 ≤ … < 500 DM  
- A63: 500 ≤ … < 1000 DM  
- A64: ≥ 1000 DM  
- A65: unknown / no savings account  

### Attribute 7: Present employment since (qualitative)
- A71: unemployed  
- A72: … < 1 year  
- A73: 1 ≤ … < 4 years  
- A74: 4 ≤ … < 7 years  
- A75: ≥ 7 years  

### Attribute 8: Installment rate in % of disposable income (numerical)

### Attribute 9: Personal status and sex (qualitative)
- A91: male – divorced/separated  
- A92: female – divorced/separated/married  
- A93: male – single  
- A94: male – married/widowed  
- A95: female – single  

### Attribute 10: Other debtors / guarantors (qualitative)
- A101: none  
- A102: co-applicant  
- A103: guarantor  

### Attribute 11: Present residence since (numerical)

### Attribute 12: Property (qualitative)
- A121: real estate  
- A122: building society savings agreement / life insurance  
- A123: car or other (not in attribute 6)  
- A124: unknown / no property  

### Attribute 13: Age in years (numerical)

### Attribute 14: Other installment plans (qualitative)
- A141: bank  
- A142: stores  
- A143: none  

### Attribute 15: Housing (qualitative)
- A151: rent  
- A152: own  
- A153: for free  

### Attribute 16: Number of existing credits at this bank (numerical)

### Attribute 17: Job (qualitative)
- A171: unemployed/unskilled – non-resident  
- A172: unskilled – resident  
- A173: skilled employee / official  
- A174: management / self-employed / highly qualified employee / officer  

### Attribute 18: Number of people being liable to provide maintenance for (numerical)

### Attribute 19: Telephone (qualitative)
- A191: none  
- A192: yes, registered under customer’s name  

### Attribute 20: Foreign worker (qualitative)
- A201: yes  
- A202: no  

---

## 8. Cost Matrix  

This dataset includes a **cost matrix** used to reflect the relative risk of misclassification:

| Actual \ Predicted | Good (1) | Bad (2) |
|--------------------|-----------|----------|
| Good (1)           | 0         | 1        |
| Bad (2)            | 5         | 0        |

- **1 = Good credit risk**  
- **2 = Bad credit risk**

Misclassifying a *bad* customer as *good* (cost = 5) is **five times worse** than rejecting a *good* customer (cost = 1).  

This cost-sensitive structure reflects the practical risk considerations of credit scoring.
