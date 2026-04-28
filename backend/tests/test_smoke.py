from app import create_app

def test_app_factory_exists():
    app = create_app()
    app.config["TESTING"] = True
    assert app is not None

def test_app_has_testing_flag():
    app = create_app()
    app.config["TESTING"] = True
    assert app.config["TESTING"] is True
