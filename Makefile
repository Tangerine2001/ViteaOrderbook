run:
	uvicorn main:app --reload

test:
	PYTHONPATH=. pytest -v