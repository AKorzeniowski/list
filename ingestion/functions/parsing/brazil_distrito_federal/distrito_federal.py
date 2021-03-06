import os
import sys
from datetime import datetime
import csv

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import parsing_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "common/python"))
    import parsing_lib

_AGE = "Faixa Etária"
_GENDER = "Sexo"
_MUNICIPALITY = "RA"
# UF stands for Unidade Federada which is the same as State
_STATE = "UF"
_DATE_CONFIRMED = "Data Cadastro"
_DATE_SYMPTOMS = "dataPrimeirosintomas"
_DEATH = "Óbito"
_LUNG = "Pneumopatia"
_KIDNEY = "Nefropatia"
_HEMATOLOGIC = "Doença Hematológica"
_METABOLIC = "Distúrbios Metabólicos"
_IMMUNOSUPPRESSED = "Imunopressão"
_OBESITY = "Obesidade"
_OTHERS = "Outros"
_CARDIOVASCULAR = "Cardiovasculopatia"

_COMORBIDITIES_MAP = {
    "Pneumopatia": "lung disease",
    "Nefropatia": "kidney disease",
    "Distúrbios Metabólicos": "disease of metabolism",
    "Obesidade": "obesity",
    "Cardiovasculopatia": "cardiovascular system disease"
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    # Some date fields are empty
    try:
        # There is variation in how dates are reported
        if "-" in raw_date:
            date = datetime.strptime(raw_date, "%Y-%m-%d")
        else:
            date = datetime.strptime(raw_date, "%d/%m/%Y")
        return date.strftime("%m/%d/%YZ")
    except:
        return None


def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    if raw_gender == "Feminino":
        return "Female"


def convert_events(date_confirmed, date_symptoms, death):
    """There is no date of death"""
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed),
            },
        }
    ]
    if date_symptoms:
        events.append(
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": convert_date(date_symptoms),
                    "end": convert_date(date_symptoms),
                },
            }
        )
    if death == "Sim":
        events.append(
            {
                "name": "outcome",
                "value": "Death",
            }
        )
    return events


def convert_preexisting_conditions(lung: str, kidney: str, metabolic: str,
                                   cardiovascular: str, obesity: str):
    preexistingConditions = {}
    comorbidities = []

    if lung == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["Pneumopatia"])
    if kidney == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["Nefropatia"])
    if metabolic == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["Distúrbios Metabólicos"])
    if cardiovascular == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["Cardiovasculopatia"])
    if obesity == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["Obesidade"])

    if comorbidities:
        preexistingConditions["hasPreexistingConditions"] = True
        preexistingConditions["values"] = comorbidities
        return preexistingConditions
    else:
        return None


def convert_demographics(gender: str, age: str):
    if not any((gender, age)):
        return None
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        if age == ">= 60 anos":
            demo["ageRange"] = {"start": 60, "end": 120}
        # No age resolution provided below 19 years
        elif age == "<= 19 anos":
            demo["ageRange"] = {"start": 0, "end": 19}
        else:
        # Age in format '20 a 29 anos'
            age_range = age.partition(" a ")
            demo["ageRange"] = {"start": float(age_range[0]), "end": float("".join([i for i in age_range[2] if not i.isalpha()]))}
    return demo


def convert_notes(hematologic: str, immunosuppressed: str, other: str):
    raw_notes = []
    if immunosuppressed == "Sim":
        raw_notes.append("Patient with immunosuppression")
    if hematologic == "Sim":
        raw_notes.append("Hematologic disease")
    if other == "Sim":
        raw_notes.append("Unspecified pre-existing condition")

    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            confirmed_date = convert_date(row[_DATE_CONFIRMED])
            # There are a few entries for other states
            if row[_STATE] == "DISTRITO FEDERAL" and confirmed_date is not None:
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": {
                            "query": ", ".join(
                                [row[_MUNICIPALITY], "Distrito Federal", "Brazil"]
                            )
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_DATE_SYMPTOMS],
                            row[_DEATH]
                        ),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE]
                        ),
                    }
                    case["preexistingConditions"] = convert_preexisting_conditions(
                        row[_LUNG], row[_KIDNEY], row[_METABOLIC], row[_CARDIOVASCULAR], row[_OBESITY]
                    )
                    notes = convert_notes(
                        row[_HEMATOLOGIC], row[_IMMUNOSUPPRESSED], row[_OTHERS]
                    )
                    if notes:
                        case["notes"] = notes
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
