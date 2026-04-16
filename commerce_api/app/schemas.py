from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    name = fields.Str(load_default="")


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=1))


class UserUpdateSchema(Schema):
    name = fields.Str(required=False)
    role = fields.Str(
        required=False,
        validate=validate.OneOf(["admin", "customer"]),
    )


class ProductCreateSchema(Schema):
    sku = fields.Str(required=True)
    name = fields.Str(required=True)
    description = fields.Str(load_default="")
    price_cents = fields.Int(required=True, validate=validate.Range(min=0))
    stock = fields.Int(load_default=0, validate=validate.Range(min=0))
    active = fields.Bool(load_default=True)


class ProductUpdateSchema(Schema):
    name = fields.Str(required=False)
    description = fields.Str(required=False)
    price_cents = fields.Int(required=False, validate=validate.Range(min=0))
    stock = fields.Int(required=False, validate=validate.Range(min=0))
    active = fields.Bool(required=False)


class OrderLineInputSchema(Schema):
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))


class OrderCreateSchema(Schema):
    lines = fields.List(
        fields.Nested(OrderLineInputSchema),
        required=True,
        validate=validate.Length(min=1, error="At least one line item is required."),
    )


class OrderStatusSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(["placed", "cancelled"]),
    )
